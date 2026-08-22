import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CHAT_SIDEBAR_FOUNDATION } from '../src/services/chatSidebarFoundation.js';
import { KURUKOO_OS_COMPONENTS } from '../src/services/kurukooOsComponentRegistry.js';

const shellRuntime = readFileSync(resolve(process.cwd(), 'public/js/kurukoo-desk-system.js'), 'utf8');
const componentCss = readFileSync(resolve(process.cwd(), 'public/css/kurukoo-os-components.css'), 'utf8');
const icons = readFileSync(resolve(process.cwd(), 'public/icons/kurukoo-icons.svg'), 'utf8');

for (const required of [
  'Search Kurukoo','Notifications','Account','/points','/cart','/chat','/requests','/tasks','/discover','/connect','/topics','/saved','/reminders','/memory','/safety','/settings'
]) assert.ok(shellRuntime.includes(required), `Desk shell missing ${required}`);
assert.ok(shellRuntime.includes("'k-desk-search-trigger'"));
assert.ok(shellRuntime.includes("'k-desk-header-cart'"));
assert.ok(shellRuntime.includes('renderOsWorkspace'));
assert.ok(shellRuntime.includes('renderContext'));
assert.ok(componentCss.includes('.kos-conversation-card'));
assert.ok(componentCss.includes('.kos-activity-card'));
assert.ok(componentCss.includes('.kos-object-list'));
assert.ok(componentCss.includes('.kos-opportunity-card'));
assert.ok(componentCss.includes('.kos-context-drawer'));
assert.match(icons, /symbol id="search"/);
assert.match(icons, /symbol id="user"/);
assert.ok(CHAT_SIDEBAR_FOUNDATION.some((item) => item.id === 'cart' && item.targetPlacement === 'header'));
assert.ok(CHAT_SIDEBAR_FOUNDATION.some((item) => item.id === 'notifications' && item.targetPlacement === 'header'));
assert.ok(KURUKOO_OS_COMPONENTS.some((item) => item.id === 'conversation-continuation-card'));
assert.ok(KURUKOO_OS_COMPONENTS.some((item) => item.id === 'pulse-timeline'));
assert.ok(KURUKOO_OS_COMPONENTS.some((item) => item.id === 'context-inspector'));

console.log('OS shell contract passed: canonical header controls, Chat-to-Desk parity, reusable components and canonical search/account icons are present.');
