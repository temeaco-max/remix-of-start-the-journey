import { handleOnboardingInput, onboardNewUser } from '../src/services/progressiveOnboarding.js';
import { getDb } from '../src/database.js';

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log("--- Starting Onboarding Tests ---");

  // Test 1: New user onboarding name capture
  try {
    const phone = '+2348011111111';
    await onboardNewUser(phone);
    const result = await handleOnboardingInput(phone, 'Test User');
    
    if (result.reply.includes('Nice to meet you, Test User!')) {
      console.log("TEST 1: Name Capture - PASSED");
      passed++;
    } else {
      console.error("TEST 1: Name Capture - FAILED. Reply was:", result.reply);
      failed++;
    }
  } catch (e) {
    console.error("TEST 1: Name Capture - FAILED", e);
    failed++;
  }

  // Test 2: Intent capture
  try {
    const phone = '+2348011111111';
    const result = await handleOnboardingInput(phone, 'Earn Money');
    
    if (result.reply.includes('What kind of work or skills can you do?')) {
      console.log("TEST 2: Intent Capture - PASSED");
      passed++;
    } else {
      console.error("TEST 2: Intent Capture - FAILED. Reply was:", result.reply);
      failed++;
    }
  } catch (e) {
    console.error("TEST 2: Intent Capture - FAILED", e);
    failed++;
  }

  // Test 3: Skill capture
  try {
    const phone = '+2348011111111';
    const result = await handleOnboardingInput(phone, 'plumber');
    
    if (result.reply.includes('Almost done! To secure your identity')) {
      console.log("TEST 3: Skill Capture - PASSED");
      passed++;
    } else {
      console.error("TEST 3: Skill Capture - FAILED. Reply was:", result.reply);
      failed++;
    }
  } catch (e) {
    console.error("TEST 3: Skill Capture - FAILED", e);
    failed++;
  }

  // Test 4: Confirmation
  try {
    const phone = '+2348011111111';
    const result = await handleOnboardingInput(phone, 'CONFIRM');
    
    if (result.reply.includes('Congratulations! Your Kurukoo account is now fully active.')) {
      console.log("TEST 4: Confirmation - PASSED");
      passed++;
    } else {
      console.error("TEST 4: Confirmation - FAILED. Reply was:", result.reply);
      failed++;
    }
  } catch (e) {
    console.error("TEST 4: Confirmation - FAILED", e);
    failed++;
  }

  console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
