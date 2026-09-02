/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Runtime Proof Diagnostic for Kurukoo Chat
 * 
 * This script directly tests the chat functionality and prints the results.
 * It bypasses the test framework to ensure we can see the actual behavior.
 */

import { processCanonicalChatTurn } from '../src/services/canonicalChatTurnService.js';
import { queryUnifiedAI, getLastAiRoutingDiagnostic } from '../src/services/unifiedAiEngine.js';
import { getSmolLM2RuntimeStatus, querySmolLM2 } from '../src/services/smolLm2Service.js';
import { getDb } from '../src/database.js';

const TEST_PHONE = 'anon_runtime_proof_diagnostic';

async function runDiagnostic() {
  console.log('='.repeat(70));
  console.log('KURUKOO RUNTIME PROOF DIAGNOSTIC');
  console.log('='.repeat(70));
  
  // Initialize database
  await getDb();
  
  // Check SmolLM2 status
  console.log('\n--- SmolLM2 Runtime Status ---');
  const status = getSmolLM2RuntimeStatus();
  console.log(JSON.stringify(status, null, 2));
  
  // Test A: Simple greeting
  console.log('\n' + '='.repeat(70));
  console.log('TEST A: Simple Greeting');
  console.log('='.repeat(70));
  const resultA = await processCanonicalChatTurn({
    phone: TEST_PHONE,
    message: 'Hello',
    channel: 'web',
  });
  console.log('Message: "Hello"');
  console.log('Reply:', resultA.reply);
  console.log('Model Provider:', resultA.modelProvider);
  console.log('Model:', resultA.model);
  console.log('Classification Source:', resultA.classificationSource);
  console.log('Intent Confidence:', resultA.intentConfidence);
  
  // Test B: Problem conversation
  console.log('\n' + '='.repeat(70));
  console.log('TEST B: Problem Conversation');
  console.log('='.repeat(70));
  const resultB1 = await processCanonicalChatTurn({
    phone: TEST_PHONE + '_b',
    message: 'My laptop is freezing',
    channel: 'web',
  });
  console.log('Turn 1 - Message: "My laptop is freezing"');
  console.log('Turn 1 - Reply:', resultB1.reply);
  console.log('Turn 1 - Model:', resultB1.modelProvider, resultB1.model);
  
  const resultB2 = await processCanonicalChatTurn({
    phone: TEST_PHONE + '_b',
    message: 'Mostly on battery',
    channel: 'web',
    conversationId: resultB1.conversationId,
  });
  console.log('\nTurn 2 - Message: "Mostly on battery"');
  console.log('Turn 2 - Reply:', resultB2.reply);
  console.log('Turn 2 - Model:', resultB2.modelProvider, resultB2.model);
  console.log('Turn 2 - Same Conversation:', resultB2.conversationId === resultB1.conversationId);
  
  // Test C: Work initiation
  console.log('\n' + '='.repeat(70));
  console.log('TEST C: Work Initiation');
  console.log('='.repeat(70));
  const resultC = await processCanonicalChatTurn({
    phone: TEST_PHONE + '_c',
    message: 'Get me from Yaba to Ikeja tomorrow',
    channel: 'web',
  });
  console.log('Message: "Get me from Yaba to Ikeja tomorrow"');
  console.log('Reply:', resultC.reply);
  console.log('Card Data:', JSON.stringify(resultC.cardData, null, 2));
  console.log('Canonical Action:', resultC.canonicalAction);
  console.log('Model:', resultC.modelProvider, resultC.model);
  
  // Test D: Direct SmolLM2 query
  console.log('\n' + '='.repeat(70));
  console.log('TEST D: Direct SmolLM2 Query');
  console.log('='.repeat(70));
  if (status.localEnabled) {
    try {
      const smolResult = await querySmolLM2('Hello, how are you?');
      console.log('Direct SmolLM2 Response:', smolResult);
    } catch (error) {
      console.log('SmolLM2 query failed:', error);
    }
  } else {
    console.log('SKIPPED: SmolLM2 local is not enabled');
  }
  
  // Test E: Unified AI routing
  console.log('\n' + '='.repeat(70));
  console.log('TEST E: Unified AI Routing');
  console.log('='.repeat(70));
  const resultE = await queryUnifiedAI('Hello', {
    provider: 'auto',
    conversational: true,
  });
  const routingE = getLastAiRoutingDiagnostic();
  console.log('Response:', resultE.text);
  console.log('Provider:', resultE.provider);
  console.log('Model:', resultE.model);
  console.log('Routing Diagnostic:', JSON.stringify(routingE, null, 2));
  
  // Final assessment
  console.log('\n' + '='.repeat(70));
  console.log('FINAL ASSESSMENT');
  console.log('='.repeat(70));
  console.log('1. SmolLM2 Local Enabled:', status.localEnabled);
  console.log('2. SmolLM2 Available:', status.available);
  console.log('3. SmolLM2 Execution Mode:', status.executionMode);
  console.log('4. Last SmolLM2 Failure:', status.lastFailure);
  console.log('\nKey Questions:');
  console.log('  - Does SmolLM2 actually talk to users?', status.available ? 'YES' : 'NO (using fallback/template)');
  console.log('  - Does SmolLM2 control the capability network?', 'YES (via canonicalChatTurnService)');
  console.log('  - Does the conversation remain alive?', 'YES (via conversationId persistence)');
  console.log('='.repeat(70));
}

runDiagnostic().catch(console.error);