import { getMistralStatus, testMistralConnection, queryMistral } from '../src/services/mistralService.js';
import { queryUnifiedAI } from '../src/services/unifiedAiEngine.js';

const before = getMistralStatus();
const connection = await testMistralConnection();
let direct = '';
let unified: any = null;
if (connection.reachable) {
  direct = await queryMistral(
    'In one concise sentence, what does Kurukoo help a person do?',
    {
      systemInstruction: 'Answer naturally and truthfully. Do not claim providers, payments, delivery, or external completion.',
      temperature: 0,
      maxOutputTokens: 80,
    },
  );
  unified = await queryUnifiedAI(
    'In one concise sentence, what does Kurukoo help a person do?',
    { provider: 'mistral', skipMemory: true },
  );
}
console.log(JSON.stringify({
  configured: before.configured,
  connection: {
    reachable: connection.reachable,
    status: connection.status,
    note: connection.note,
    modelCount: connection.modelCount,
  },
  direct: direct.slice(0, 240),
  unified: unified ? {
    provider: unified.provider,
    model: unified.model,
    text: String(unified.text).slice(0, 240),
  } : null,
}, null, 2));
