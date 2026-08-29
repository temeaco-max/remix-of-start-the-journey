/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import assert from 'node:assert/strict';
import { CHAT_SIDEBAR_FOUNDATION } from '../src/services/chatSidebarFoundation.js';
import { KURUKOO_OS_COMPONENTS, KURUKOO_BRAND_REFERENCE_BOUNDARY } from '../src/services/kurukooOsComponentRegistry.js';

const ids = new Set(KURUKOO_OS_COMPONENTS.map((item) => item.id));
assert.equal(ids.size, KURUKOO_OS_COMPONENTS.length, 'OS component IDs must be unique');
for (const item of KURUKOO_OS_COMPONENTS) {
  assert.ok(item.purpose.length > 20, `${item.id} needs a meaningful purpose`);
  assert.ok(item.reusableOn.length > 0, `${item.id} needs at least one consumer`);
}

for (const item of ['conversation-continuation-card','activity-flow-card','object-summary-list-card','opportunity-card','metric-progress-card','topic-cluster','media-guide-card','connection-status-list','pulse-timeline','status-action-card','activity-summary','sponsored-entity-card','agent-context-card','recent-conversations-list','shell-presence-status','nearby-radar-control','context-inspector','search-command-drawer','notification-drawer','account-drawer','cart-header-control']) {
  assert.ok(ids.has(item), `Missing required OS component: ${item}`);
}

const chatIds = new Set(CHAT_SIDEBAR_FOUNDATION.map((item) => item.id));
assert.equal(chatIds.size, CHAT_SIDEBAR_FOUNDATION.length, 'Chat sidebar capability IDs must be unique');
for (const id of ['new-conversation','conversation','requests','tasks','discover','connect','topics','recent-conversations','presence','memory-status','connected-status','nearby-radar','top-up','subscription','saved','reminders','safety','settings','cart','points-balance','notifications','conversation-context','conversation-overflow','inspector-current-request','inspector-discovery']) assert.ok(chatIds.has(id), `Chat capability omitted from Desk parity contract: ${id}`);
assert.ok(CHAT_SIDEBAR_FOUNDATION.filter((item) => item.targetPlacement === 'header').some((item) => item.id === 'cart'), 'Cart must remain a header action, not primary sidebar navigation');
assert.equal(KURUKOO_BRAND_REFERENCE_BOUNDARY.literalLogoTreatmentMayNotBeCopied, true);
assert.equal(KURUKOO_BRAND_REFERENCE_BOUNDARY.personalWorkspaceImageIsDeskContentReferenceOnly, true);

console.log(`OS component foundation passed: ${KURUKOO_OS_COMPONENTS.length} reusable components and ${CHAT_SIDEBAR_FOUNDATION.length} Chat-to-Desk capabilities are protected.`);
