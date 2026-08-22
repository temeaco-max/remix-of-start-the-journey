import { strict as assert } from 'node:assert';
import {
  PRIMARY_SIDEBAR_ITEMS,
  SECONDARY_SIDEBAR_ITEMS,
  HEADER_ITEMS,
  ACCOUNT_MENU_ITEMS,
  SETTINGS_SECTION_ITEMS,
} from '../src/services/authenticatedNavigationModel';

assert.deepEqual(PRIMARY_SIDEBAR_ITEMS.map((item) => item.id), ['desk', 'agent', 'discover', 'requests', 'tasks']);
assert.deepEqual(SECONDARY_SIDEBAR_ITEMS.map((item) => item.id), ['reminders', 'topics']);
assert.deepEqual(HEADER_ITEMS.map((item) => item.id), ['search', 'points', 'cart', 'notifications', 'account']);

const accountIds = new Set(ACCOUNT_MENU_ITEMS.map((item) => item.id));
for (const required of ['profile', 'settings', 'subscriptions', 'top-up', 'wallet', 'agents', 'connect', 'saved']) {
  assert.equal(accountIds.has(required), true, `Account menu missing ${required}`);
}

const settingsIds = new Set(SETTINGS_SECTION_ITEMS.map((item) => item.id));
for (const required of ['appearance', 'contacts', 'memory', 'safety', 'notifications-settings', 'privacy-settings', 'settings-security']) {
  assert.equal(settingsIds.has(required), true, `Settings missing ${required}`);
}

assert.equal(PRIMARY_SIDEBAR_ITEMS.some((item) => item.id === 'cart'), false);
assert.equal(PRIMARY_SIDEBAR_ITEMS.some((item) => item.id === 'points'), false);
assert.equal(SECONDARY_SIDEBAR_ITEMS.some((item) => item.id === 'cart'), false);
assert.equal(SECONDARY_SIDEBAR_ITEMS.some((item) => item.id === 'points'), false);
assert.equal(SECONDARY_SIDEBAR_ITEMS.some((item) => item.id === 'saved'), false);
assert.equal(ACCOUNT_MENU_ITEMS.some((item) => item.id === 'memory'), false);
assert.equal(ACCOUNT_MENU_ITEMS.some((item) => item.id === 'safety'), false);
assert.equal(SETTINGS_SECTION_ITEMS.some((item) => item.id === 'appearance'), true);

console.log('authenticated navigation model: PASS');
