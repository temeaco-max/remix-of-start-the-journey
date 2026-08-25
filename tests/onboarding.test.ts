import { handleOnboardingInput, onboardNewUser } from '../src/services/progressiveOnboarding.js';
import { getProfile } from '../src/services/memoryProfile.js';

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('--- Starting Onboarding Tests ---');

  try {
    const phone = '+2348011111111';
    const welcome = await onboardNewUser(phone);
    if (welcome.includes('Welcome to Kurukoo') && welcome.includes('what you need')) {
      passed++;
    } else {
      console.error('TEST 1: Welcome flow - FAILED. Reply was:', welcome);
      failed++;
    }
  } catch (e) {
    console.error('TEST 1: Welcome flow - FAILED', e);
    failed++;
  }

  try {
    const phone = '+2348011111111';
    const result = await handleOnboardingInput(phone, 'Test User');
    const profile = await getProfile(phone, 'onboarding-test');
    if (
      result.reply.includes('Nice to meet you, Test User.') &&
      result.reply.includes('Tell me what you need done') &&
      result.cardData?.type === 'welcome' &&
      profile?.name === 'Test User'
    ) {
      passed++;
    } else {
      console.error('TEST 2: Name + handoff to useful work - FAILED. Result:', result);
      failed++;
    }
  } catch (e) {
    console.error('TEST 2: Name + handoff to useful work - FAILED', e);
    failed++;
  }

  try {
    const phone = '+2348011111112';
    await onboardNewUser(phone);
    const result = await handleOnboardingInput(phone, 'none');
    const profile = await getProfile(phone, 'onboarding-test-none');
    if (result.reply.includes('Tell me what you need done') && profile?.preferences?.onboarding_complete === true) {
      passed++;
    } else {
      console.error('TEST 3: Mid-flow progressive completion - FAILED. Result:', result);
      failed++;
    }
  } catch (e) {
    console.error('TEST 3: Mid-flow progressive completion - FAILED', e);
    failed++;
  }

  try {
    const phone = '+2348011111113';
    await onboardNewUser(phone);
    const result = await handleOnboardingInput(phone, 'plumber');
    if (result.reply.includes('Tell me what you need done')) {
      passed++;
    } else {
      console.error('TEST 4: Free-form first request - FAILED. Result:', result);
      failed++;
    }
  } catch (e) {
    console.error('TEST 4: Free-form first request - FAILED', e);
    failed++;
  }

  console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
