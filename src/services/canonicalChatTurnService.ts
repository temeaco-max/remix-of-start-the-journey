import { appendChatMessage } from './chatConversationService.js';
import { getProfile } from './memoryProfile.js';
import { isOnboarding, handleOnboardingInput } from './progressiveOnboarding.js';
import { routeIntent } from './intentRouter.js';
import { getAuthState, setAuthState, handleConversationalAuth } from './conversationalAuthService.js';
import { handleSafetyContactInput, setSafetyCaptureState } from './safetyService.js';
import { createConversationGoal } from './agentRuntime.js';

export interface CanonicalChatTurnInput {
  phone: string;
  message: string;
  channel: string;
  conversationId?: string;
  attachment?: unknown;
}

export interface CanonicalChatTurnResult {
  phone: string;
  conversationId: string;
  userMessageId: number;
  reply: string;
  cardData?: any;
  authSuccess?: { phone: string; token: string };
  agentGoal?: { id: string; status: string; objective: string; summary?: string; autonomy?: string; economicRequestId?: string };
}

/** The single server-side authority for a Kurukoo conversational turn. */
export async function processCanonicalChatTurn(input: CanonicalChatTurnInput): Promise<CanonicalChatTurnResult> {
  const phone = String(input.phone || '').trim();
  const message = String(input.message || '').trim();
  if (!phone || !message) throw new Error('Phone and message are required');

  const userMessage = await appendChatMessage({
    phone,
    sender: 'user',
    content: message,
    channel: input.channel,
    conversationId: input.conversationId,
    metadata: input.attachment ? { attachment: input.attachment } : undefined,
  });

  let reply = '';
  let cardData: any = undefined;
  let authSuccess: { phone: string; token: string } | undefined;
  let agentGoal: any = null;
  const isGuest = phone.startsWith('anon_');
  const authState = isGuest ? await getAuthState(phone) : { state: 'none' as const, data: {} };

  const profile = await getProfile(phone, 'canonical_chat_turn');
  const prefs: any = profile?.preferences && typeof profile.preferences === 'object' ? profile.preferences : {};
  const safetyState = prefs.safety_capture_state || 'none';

  if (isGuest && authState.state !== 'none') {
    const result = await handleConversationalAuth(phone, message);
    reply = result.reply;
    cardData = result.cardData;
    if (result.authenticated && result.token && result.phone) authSuccess = { phone: result.phone, token: result.token };
  } else if (!isGuest && safetyState !== 'none') {
    const result = await handleSafetyContactInput(phone, message);
    reply = result.reply;
    cardData = result.cardData;
  } else if (!isGuest && await isOnboarding(phone)) {
    const result = await handleOnboardingInput(phone, message);
    reply = result.reply;
    cardData = result.cardData;
  } else {
    const routing = await routeIntent(message, phone);
    cardData = routing.cardData;
    const explicitAgentIntent = routing.skill === 'autonomous_agent' || /\b(keep checking|keep looking|monitor|watch for|tell me when|let me know when|check again)\b/i.test(message);
    agentGoal = !isGuest && explicitAgentIntent ? await createConversationGoal({
      phone,
      conversationId: userMessage.conversationId,
      skill: routing.skill,
      objective: message,
      economicRequestId: typeof cardData?.requestId === 'string' ? cardData.requestId : undefined,
      source: input.channel === 'web_qr' ? 'qr' : 'conversation',
    }) : null;

    if (routing.skill && routing.skill !== 'general_question' && routing.skill !== 'autonomous_agent' && isGuest) {
      await setAuthState(phone, 'awaiting_name', { intent: routing.skill, continuationCard: cardData });
      reply = `${routing.reply}\n\nI can help with that. Before I save this for you, let's create your Kurukoo profile. What's your name?`;
      cardData = {
        type: 'auth_in_chat_start',
        title: 'Create Your Profile',
        message: 'Your request is captured. Tell me your name to continue.',
        continuationCard: routing.cardData,
      };
    } else {
      // Native assistance remains native. Economic Requests are created and
      // advanced only by canonical request services invoked by the router.
      reply = routing.reply;
    }
  }

  if (cardData?.type === 'safety_contact_capture') {
    await setSafetyCaptureState(phone, 'awaiting_phone', { name: cardData.name });
  }

  return persistTurn({
    userMessage,
    phone,
    channel: input.channel,
    reply,
    cardData,
    authSuccess,
    agentGoal,
  });
}

async function persistTurn(args: {
  userMessage: { id: number; conversationId: string };
  phone: string;
  channel: string;
  reply: string;
  cardData?: any;
  authSuccess?: { phone: string; token: string };
  agentGoal?: any;
}): Promise<CanonicalChatTurnResult> {
  await appendChatMessage({
    phone: args.phone,
    sender: 'assistant',
    content: args.reply.trim(),
    channel: args.channel,
    conversationId: args.userMessage.conversationId,
    cardData: args.cardData,
    metadata: { ai: true, canonical_turn: true },
  });
  return {
    phone: args.phone,
    conversationId: args.userMessage.conversationId,
    userMessageId: args.userMessage.id,
    reply: args.reply.trim(),
    cardData: args.cardData,
    authSuccess: args.authSuccess,
    agentGoal: args.agentGoal,
  };
}

export default processCanonicalChatTurn;
