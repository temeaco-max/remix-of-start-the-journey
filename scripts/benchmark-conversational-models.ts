import { queryMistral, getMistralModel, testMistralConnection } from '../src/services/mistralService.js';
import { querySmolLM2, getSmolLM2RuntimeStatus } from '../src/services/smolLm2Service.js';
import { assessConversationQuality, classifyConversationDifficulty, type ConversationQualityContext } from '../src/services/conversationQualityService.js';

interface TurnCase {
  id: string;
  user: string;
  expectedMode: 'conversation' | 'exploration' | 'action' | 'reference';
  knownFacts?: string[];
  activeContextIds?: string[];
}

const CASES: TurnCase[] = [
  { id: 'casual-1', user: 'How are you?', expectedMode: 'conversation' },
  { id: 'explore-cleaner', user: "I'm thinking about getting a cleaner this weekend.", expectedMode: 'exploration' },
  { id: 'action-cleaner', user: 'Please find me a cleaner in Ibadan for this weekend.', expectedMode: 'action' },
  { id: 'repair-uncertain', user: "My phone has been acting weird since yesterday.", expectedMode: 'conversation' },
  { id: 'correction', user: 'Actually, make that Saturday instead.', expectedMode: 'reference', activeContextIds: ['request:repair-1'] },
  { id: 'relative', user: 'No, the cheaper one.', expectedMode: 'reference', activeContextIds: ['request:repair-1', 'offer:2'] },
  { id: 'dialect', user: 'Abeg help me find person wey fit fix am sharp sharp.', expectedMode: 'action' },
  { id: 'informal-food', user: 'Where can I get good suya around here tonight?', expectedMode: 'exploration' },
  { id: 'no-action', user: 'What do you think is the best way to deal with a leaking tap?', expectedMode: 'exploration' },
  { id: 'multi-context', user: 'Go back to the phone issue.', expectedMode: 'reference', activeContextIds: ['request:phone', 'reminder:1'] },
];

function expectedActionLanguage(user: string): boolean {
  return /\b(?:please find|find me|book|buy|order|hire|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set a reminder|go ahead|do it)\b/i.test(user);
}

function scoreTurn(test: TurnCase, reply: string) {
  const qualityContext: ConversationQualityContext = {
    latestUserMessage: test.user,
    assistantReply: reply,
    activeContextIds: test.activeContextIds,
    knownFacts: test.knownFacts,
  };
  const quality = assessConversationQuality(qualityContext);
  const difficulty = classifyConversationDifficulty(test.user, qualityContext);
  const hasActionLanguage = /\b(?:book|order|hire|find someone|arrange|schedule|pay|cancel|subscribe|dispatch|send|confirm|create|set a reminder)\b/i.test(reply);
  const prematureAction = !expectedActionLanguage(test.user) && hasActionLanguage && /\b(?:thinking about|maybe|might|wondering|what do you think|what is a good|how should)\b/i.test(test.user);
  return {
    ...test,
    quality,
    difficulty,
    prematureAction,
    reply,
  };
}

async function main() {
  const limit = Math.max(1, Number(process.env.CONVERSATION_BENCHMARK_LIMIT || CASES.length));
  const cases = CASES.slice(0, limit);
  const results: Record<string, unknown>[] = [];

  let mistralReachable = false;
  if (process.env.MISTRAL_API_KEY) {
    const status = await testMistralConnection();
    mistralReachable = status.reachable;
    console.log(`[conversation-benchmark] Mistral: ${status.note}`);
  }

  const smollmStatus = getSmolLM2RuntimeStatus();
  console.log(`[conversation-benchmark] SmolLM2: ${smollmStatus.model} source=${smollmStatus.source} available=${smollmStatus.available}`);

  for (const test of cases) {
    const started = Date.now();
    let smollmReply = '';
    try {
      smollmReply = await querySmolLM2(test.user);
    } catch (error) {
      smollmReply = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
    }
    results.push({ model: smollmStatus.model, provider: 'SmolLM2', latencyMs: Date.now() - started, ...scoreTurn(test, smollmReply) });

    if (mistralReachable) {
      const mistralStarted = Date.now();
      try {
        const reply = await queryMistral(test.user, { conversationalContract: true });
        results.push({ model: getMistralModel(), provider: 'Mistral', latencyMs: Date.now() - mistralStarted, ...scoreTurn(test, reply) });
      } catch (error) {
        results.push({ model: getMistralModel(), provider: 'Mistral', latencyMs: Date.now() - mistralStarted, ...scoreTurn(test, `ERROR: ${error instanceof Error ? error.message : String(error)}`) });
      }
    }
  }

  const valid = results.filter(item => item && typeof item === 'object') as Array<any>;
  const byProvider = new Map<string, any[]>();
  for (const result of valid) {
    const provider = String(result.provider || 'unknown');
    const list = byProvider.get(provider) || [];
    list.push(result);
    byProvider.set(provider, list);
  }

  for (const [provider, items] of byProvider) {
    const avgQuality = items.reduce((sum, item) => sum + Number(item.quality?.score || 0), 0) / Math.max(1, items.length);
    const prematureActions = items.filter(item => item.prematureAction).length;
    const conversational = items.filter(item => item.quality?.conversational).length;
    console.log(`${provider}: avg_quality=${avgQuality.toFixed(3)} conversational=${conversational}/${items.length} premature_action=${prematureActions}/${items.length}`);
  }

  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), cases: cases.length, results }, null, 2));
}

main().catch(error => {
  console.error('[conversation-benchmark] failed:', error);
  process.exitCode = 1;
});
