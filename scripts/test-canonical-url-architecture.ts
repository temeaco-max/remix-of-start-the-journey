import { CANONICAL_URLS, LEGACY_URL_ALIASES, canonicalizeUrl } from '../src/services/canonicalUrlRegistry.js';

const failures: string[] = [];
const require = (condition: boolean, message: string) => { if (!condition) failures.push(message); };

require(CANONICAL_URLS.desk.home === '/desk', 'Desk must be the canonical authenticated home.');
require(CANONICAL_URLS.conversation.agent === '/chat', 'Agent must use /chat as the conversational surface.');
require(CANONICAL_URLS.conversation.conversation('abc') === '/chat/abc', 'Conversation detail URL must be /chat/:conversationId.');
require(CANONICAL_URLS.conversation.share('abc') === '/share/abc', 'Shared conversation URL must be /share/:shareId.');
require(CANONICAL_URLS.desk.request('REQ-123') === '/requests/REQ-123', 'Request detail URL must be /requests/:id.');
require(CANONICAL_URLS.desk.task('TASK-123') === '/tasks/TASK-123', 'Task detail URL must be /tasks/:id.');
require(CANONICAL_URLS.desk.opportunity('OPP-123') === '/opportunities/OPP-123', 'Opportunity detail URL must be /opportunities/:id.');
require(CANONICAL_URLS.admin.user('USR-123') === '/admin/users/USR-123', 'Admin user detail URL must be /admin/users/:id.');
require(CANONICAL_URLS.api.root === '/api/v1', 'API must have a versioned root.');

for (const [legacy, canonical] of Object.entries(LEGACY_URL_ALIASES)) {
  require(legacy !== canonical, `Legacy alias must differ from canonical route: ${legacy}`);
  require(canonicalizeUrl(legacy) === canonical, `Legacy alias does not canonicalize correctly: ${legacy}`);
}

for (const route of Object.values(CANONICAL_URLS.desk)) {
  if (typeof route === 'string') require(!route.startsWith('/app/'), `Canonical Desk URL must not use /app/: ${route}`);
}

if (failures.length) {
  console.error('Canonical URL architecture test failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Canonical URL architecture test passed: Desk, Agent/Chat, durable resource URLs, Admin namespaces and versioned API root are defined and legacy aliases resolve toward them.');
