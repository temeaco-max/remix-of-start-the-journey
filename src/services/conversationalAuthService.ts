import { getDb, saveDb } from '../database.js';
import { getProfile, updateProfile } from './memoryProfile.js';
import { isEmailOtpEnabled, normalizeOtpEmail, normalizeOtpPhone, requestEmailOtp, requestPhoneOtp, verifyEmailOtp, verifyPhoneOtp } from './otpAuthService.js';
import { developmentTestOtpLabel, isDevelopmentTestIdentity, verifyDevelopmentTestOtp } from './devTestAuthService.js';
import { issueUserToken, upsertProfile } from '../routes/authRoutes.js';
import { sendFcmPush } from './pushNotifications.js';

export type AuthState = 'none' | 'awaiting_name' | 'awaiting_phone' | 'awaiting_otp' | 'awaiting_email_phone' | 'awaiting_email_otp';

export interface ConversationalAuthResult {
  reply: string;
  cardData?: any;
  authenticated?: boolean;
  token?: string;
  phone?: string;
  continuationMessage?: string;
}

export async function getAuthState(guestPhone: string): Promise<{ state: AuthState, data: any }> {
  const profile = await getProfile(guestPhone, 'conversational_auth');
  const prefs = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {};
  return {
    state: (prefs.auth_in_chat_state || 'none') as AuthState,
    data: prefs.auth_in_chat_data && typeof prefs.auth_in_chat_data === 'object' ? prefs.auth_in_chat_data : {},
  };
}

export async function setAuthState(guestPhone: string, state: AuthState, data: any = {}): Promise<void> {
  const profile = await getProfile(guestPhone, 'conversational_auth');
  const prefs = profile?.preferences && typeof profile.preferences === 'object' ? { ...profile.preferences } : {};
  prefs.auth_in_chat_state = state;
  prefs.auth_in_chat_data = data;
  // updateProfile creates the lightweight guest record when needed and keeps
  // conversational-auth state inside the canonical encrypted profile boundary.
  await updateProfile(guestPhone, 'conversational_auth', { preferences: prefs });
}

export async function handleConversationalAuth(guestPhone: string, text: string): Promise<ConversationalAuthResult> {
  const { state, data } = await getAuthState(guestPhone);
  
  if (state === 'awaiting_name') {
    const name = text.trim();
    if (!name) return { reply: "I didn't catch your name. What should I call you?" };
    
    await setAuthState(guestPhone, 'awaiting_phone', { ...data, name });
    return {
      reply: `Nice to meet you, ${name}. Enter your phone number below and I’ll send a verification code to secure your account.`,
      cardData: { type: 'auth_conversation', step: 'phone', name },
    };
  }
  
  if (state === 'awaiting_phone') {
    const supplied = text.trim();
    if (supplied.includes('@') && isEmailOtpEnabled()) {
      const email = normalizeOtpEmail(supplied);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { reply: 'That email address does not look valid. You can enter your phone number, or try the email again.' };
      await setAuthState(guestPhone, 'awaiting_email_phone', { ...data, email });
      return { reply: 'Email can be used for the verification code, while your phone remains your primary Kurukoo channel identity. What phone number should stay connected to your account?', cardData: { type: 'auth_conversation', step: 'phone', email } };
    }
    const digits = supplied.replace(/\D/g, '');
    if (digits.length < 10) return { reply: "That doesn't look like a valid phone number. Please enter your full phone number (e.g. 080...)" };

    // Preserve an explicit international prefix so OTP and profile identity remain owner-scoped.
    const fullPhone = normalizeOtpPhone(supplied);
    
    const result = await requestPhoneOtp(fullPhone);
    if (!result.success) return { reply: `I couldn't request a code for that number: ${result.message || 'unknown error'}. Please try again.` };

    await setAuthState(guestPhone, 'awaiting_otp', { ...data, phone: fullPhone });
    const controlledTest = isDevelopmentTestIdentity(fullPhone);
    const delivered = /sent|delivery/i.test(String(result.message || '')) && !/generated|configure/i.test(String(result.message || ''));
    let reply = controlledTest
      ? `For this controlled development test, use verification code ${developmentTestOtpLabel()}. No external SMS was sent.`
      : delivered
        ? "I've sent a 6-digit verification code to your phone. Enter it here to continue."
        : "I've created the verification request, but external SMS/WhatsApp delivery is not configured in this environment. Do not assume a code was delivered; connect an approved delivery provider before using this flow with real users.";

    return {
      reply,
      cardData: { type: 'auth_conversation', step: 'otp', phone: fullPhone, devCode: controlledTest ? developmentTestOtpLabel() : undefined }
    };
  }
  
  if (state === 'awaiting_email_phone') {
    const phone = normalizeOtpPhone(text.trim());
    if (phone.replace(/\D/g, '').length < 10) return { reply: 'That does not look like a valid phone number. Please enter your full phone number.' };
    const result = await requestEmailOtp(data.email, phone);
    if (!result.success) return { reply: result.message || 'I could not request the email code yet.' };
    await setAuthState(guestPhone, 'awaiting_email_otp', { ...data, phone });
    const codeNote = result.debugCode ? ` For this development test, use ${result.debugCode}.` : '';
    return { reply: `I’ve sent a verification code to ${data.email}. Enter it here to continue.${codeNote}`, cardData: { type: 'auth_conversation', step: 'otp', email: data.email } };
  }

  if (state === 'awaiting_email_otp') {
    const code = text.trim().replace(/\D/g, '');
    if (code.length !== 6) return { reply: 'Please enter the 6-digit code sent to your email.' };
    const result = await verifyEmailOtp(data.email, code);
    if (!result.success) return { reply: `That email code did not work: ${result.message}. Please check it and try again.` };
    const userPhone = result.phone || data.phone;
    await upsertProfile(userPhone, data.name, data.email);
    const db = await getDb();
    db.run('UPDATE memory_profiles SET email_verified_at = CURRENT_TIMESTAMP WHERE phone = ?', [userPhone]);
    saveDb();
    const token = issueUserToken(userPhone);
    await sendFcmPush(userPhone, 'Kurukoo details confirmed', `Thanks for confirming your email, ${data.name || 'friend'}. Your account is now connected.`, '/chat').catch(() => false);
    await setAuthState(guestPhone, 'none');
    return { reply: `Thanks for confirming your email, ${data.name || 'friend'}. Your phone remains connected as your primary Kurukoo channel identity, and I’ll continue with the request we were discussing.`, authenticated: true, token, phone: userPhone, continuationMessage: data.continuationMessage || undefined, cardData: data.continuationCard || undefined };
  }

  if (state === 'awaiting_otp') {
    const code = text.trim().replace(/\D/g, '');
    if (code.length !== 6) return { reply: "Please enter the 6-digit code I sent to your phone." };
    
    const developmentResult = verifyDevelopmentTestOtp(data.phone, code);
    const result = developmentResult || await verifyPhoneOtp(data.phone, code);
    if (!result.success || !result.phone) return { reply: `That code didn't work: ${result.message}. Please check the code and try again.` };
    
    const userPhone = result.phone;
    await upsertProfile(userPhone, data.name);
    const token = issueUserToken(userPhone);
    await sendFcmPush(userPhone, 'Kurukoo details confirmed', `Thanks for confirming your details, ${data.name || 'friend'}. Your Kurukoo account is now connected.`, '/chat').catch(() => false);

    // Clear state
    await setAuthState(guestPhone, 'none');
    
    return {
      reply: `Thanks for confirming your details, ${data.name || 'friend'}. Your Kurukoo profile is now verified, and I’ll continue with the request we were discussing.`,
      authenticated: true,
      token,
      phone: userPhone,
      continuationMessage: data.continuationMessage || undefined,
      cardData: data.continuationCard || undefined,
    };
  }
  
  return { reply: "I'm not sure how to help with that identity step." };
}
