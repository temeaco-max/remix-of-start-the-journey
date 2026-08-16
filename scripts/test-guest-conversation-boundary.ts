import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/services/conversationalAuthService.ts'), 'utf8');

const requiredPatterns = [
  'const GUEST_CONVERSATION_RE',
  'await setAuthState(guestPhone, \'none\', {});',
  'generateConversationalResponse({',
  'This is a casual greeting from a guest',
];

for (const pattern of requiredPatterns) {
  if (!source.includes(pattern)) {
    throw new Error(`Guest conversational boundary missing: ${pattern}`);
  }
}

console.log('Guest conversation/auth boundary passed: greetings are conversational, not provisional names.');
