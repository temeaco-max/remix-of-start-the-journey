process.env.NODE_ENV = 'test';
process.env.KURUKOO_AGENT_ENABLED = 'true';
process.env.KURUKOO_AGENT_AUTONOMOUS = 'false';
process.env.KURUKOO_DISABLE_LISTEN = 'true';

const { processCanonicalChatTurn } = await import('../src/services/canonicalChatTurnService.js');
const { createConversationGoal, getAgentGoal } = await import('../src/services/agentRuntime.js');

const phone = `+234701${Date.now().toString().slice(-7)}`;
const conversationId = `control-${Date.now()}`;
const created = await createConversationGoal({ phone, conversationId, skill: 'reminder', objective: 'Keep checking my reminder request', source: 'conversation' });
if (!created) throw new Error('Could not create test autonomous goal');

const paused = await processCanonicalChatTurn({ phone, message: 'pause that', channel: 'web', conversationId });
if (!paused.agentGoal || paused.agentGoal.status !== 'waiting' || !/paused/i.test(paused.reply)) throw new Error(`Pause command was not applied: ${JSON.stringify(paused)}`);

const resumed = await processCanonicalChatTurn({ phone, message: 'resume that', channel: 'web', conversationId });
if (!resumed.agentGoal || resumed.agentGoal.status !== 'needs_user' || !/resumed/i.test(resumed.reply)) throw new Error(`Resume command was not applied: ${JSON.stringify(resumed)}`);

const cancelled = await processCanonicalChatTurn({ phone, message: 'cancel that', channel: 'web', conversationId });
if (!cancelled.agentGoal || cancelled.agentGoal.status !== 'cancelled' || !/stop following|asked Kurukoo to stop/i.test(cancelled.reply)) throw new Error(`Cancel command was not applied: ${JSON.stringify(cancelled)}`);

const persisted = await getAgentGoal(phone, created.id);
if (persisted?.status !== 'cancelled') throw new Error(`Final goal state was not persisted: ${persisted?.status}`);
console.log('Agent control command regression passed: natural-language pause, resume, and cancel remain owner-scoped and persisted.');
