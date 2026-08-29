/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { detectTrajectorySignals } from '../src/services/conversationTrajectoryService.js';

type Case = { text: string; shouldAct: boolean; label: string };

const cases: Case[] = [
  { text: 'My phone has been acting weird lately.', shouldAct: false, label: 'vague-problem' },
  { text: 'I am thinking about getting a cleaner.', shouldAct: false, label: 'exploration' },
  { text: 'What do you think about finding a plumber?', shouldAct: false, label: 'exploration-question' },
  { text: 'Maybe I need someone to help me move.', shouldAct: false, label: 'tentative' },
  { text: 'Please find me a cleaner in Ibadan this weekend.', shouldAct: true, label: 'explicit-find' },
  { text: 'Book me the second option.', shouldAct: true, label: 'explicit-book' },
  { text: 'Go ahead.', shouldAct: true, label: 'explicit-go' },
  { text: 'Actually, wait a second.', shouldAct: false, label: 'hold' },
  { text: 'Forget that for now.', shouldAct: false, label: 'pause' },
  { text: 'Can someone sort this out?', shouldAct: false, label: 'underspecified' },
  { text: 'Can you show me my options first?', shouldAct: false, label: 'options-before-action' },
  { text: 'Ask the second provider if they can come tomorrow.', shouldAct: true, label: 'explicit-contact' },
  { text: 'I am frustrated with my phone.', shouldAct: false, label: 'emotion' },
  { text: 'I need someone to repair my phone.', shouldAct: true, label: 'explicit-service' },
  { text: 'Where can I get good suya around here?', shouldAct: false, label: 'discovery-question' },
  { text: 'Order the second suya option.', shouldAct: true, label: 'explicit-order' },
];

let violations = 0;
for (const testCase of cases) {
  const signals = detectTrajectorySignals(testCase.text);
  const explicit = signals.action && !signals.exploration;
  if (explicit !== testCase.shouldAct) {
    violations += 1;
    console.error(JSON.stringify({ label: testCase.label, text: testCase.text, explicit, expected: testCase.shouldAct }));
  }
}

assert.equal(violations, 0, `${violations} action-discipline cases violated the expected conversation/action boundary`);
console.log(JSON.stringify({ cases: cases.length, violations, status: 'passed' }, null, 2));
