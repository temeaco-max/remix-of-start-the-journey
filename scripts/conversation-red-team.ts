import assert from 'node:assert/strict';
import { assessConversationQuality, classifyConversationDifficulty, detectRelativeReference } from '../src/services/conversationQualityService.js';

type Case = {
  user: string;
  reply: string;
  cardType?: string;
  active?: string[];
  selected?: string;
  known?: string[];
  expected: 'conversation' | 'action' | 'reference';
};

const services = ['cleaner', 'plumber', 'electrician', 'mechanic', 'tailor', 'caterer', 'painter', 'roofer'];
const places = ['Ibadan', 'Ikeja', 'Lekki', 'Manchester', 'Toronto', 'Lagos'];
const exploratory = [
  'I am thinking about getting a',
  'Maybe I need a',
  'What do you think about finding a',
  'I might need a',
];
const action = [
  'Please find me a',
  'I need someone to get me a',
  'Book me a',
  'Can you arrange a',
];

const cases: Case[] = [];
for (let i = 0; i < 1000; i += 1) {
  const service = services[i % services.length];
  const place = places[i % places.length];
  if (i % 4 === 0) {
    const user = `${exploratory[i % exploratory.length]} ${service} in ${place}`;
    cases.push({ user, reply: `That could be worth exploring. What matters most to you about the ${service}?`, expected: 'conversation' });
  } else if (i % 4 === 1) {
    const user = `${action[i % action.length]} ${service} in ${place} this weekend`;
    cases.push({ user, reply: `I can help coordinate that. I have ${place} and this weekend; what part of the job should I use?`, cardType: 'economic_request', active: ['request:1'], selected: 'request:1', known: [place, 'this weekend'], expected: 'action' });
  } else if (i % 4 === 2) {
    const user = i % 2 ? 'the other guy' : 'the second one';
    cases.push({ user, reply: 'Sure — I’ll keep the current request and use the other option you mean.', active: ['request:1', 'request:2'], selected: 'request:2', expected: 'reference' });
  } else {
    const user = `Actually, change the ${i % 2 ? 'time' : 'location'} for the current ${service} request`;
    cases.push({ user, reply: 'Got it. I’ll apply that change to the current request rather than starting another one.', active: ['request:1'], selected: 'request:1', expected: 'action' });
  }
}

let failures = 0;
let references = 0;
let deep = 0;
for (const testCase of cases) {
  const assessment = assessConversationQuality({
    latestUserMessage: testCase.user,
    assistantReply: testCase.reply,
    cardType: testCase.cardType,
    activeContextIds: testCase.active,
    selectedContextId: testCase.selected,
    knownFacts: testCase.known,
  });
  if (assessment.issues.includes('internal_metadata_leak') || !assessment.preservedContext) failures += 1;
  const relative = detectRelativeReference(testCase.user);
  if (relative) references += 1;
  const difficulty = classifyConversationDifficulty(testCase.user, {
    activeContextIds: testCase.active,
    knownFacts: testCase.known,
  });
  if (difficulty === 'deep') deep += 1;

  if (testCase.expected === 'conversation') assert.equal(assessment.issues.includes('premature_action'), false);
  if (testCase.expected === 'reference') assert.ok(relative, `relative reference was not detected: ${testCase.user}`);
}

assert.equal(failures, 0, `${failures} conversational quality failures detected`);
assert.equal(cases.length, 1000);
assert.ok(references >= 250);
assert.ok(deep > 0);

console.log(JSON.stringify({
  scenarios: cases.length,
  failures,
  relativeReferences: references,
  deepDifficultyCases: deep,
  status: 'passed',
}, null, 2));
