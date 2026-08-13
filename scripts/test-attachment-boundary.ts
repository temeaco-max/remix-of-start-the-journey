import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/routes/chatRouter.ts', import.meta.url), 'utf8');
assert.doesNotMatch(source, /public[\\/]uploads[\\/]chat/, 'attachments must not default to a public static directory');
assert.match(source, /function privateAttachmentDir\(\)/, 'private attachment directory authority must exist');
assert.match(source, /CHAT_UPLOAD_DIR/, 'deployment-specific private storage path must remain configurable');
assert.match(source, /startsWith\(`\$\{publicRoot\}\$\{path\.sep\}`\)/, 'configured public paths must be rejected');
assert.match(source, /phone TEXT NOT NULL/, 'attachment metadata must bind an owner phone');
assert.match(source, /WHERE id=\? AND phone=\?/, 'retrieval and deletion must enforce owner binding');
assert.match(source, /expires_at>CURRENT_TIMESTAMP/, 'expired attachments must not be served');
assert.match(source, /cleanupExpiredAttachments/, 'expired files must be cleaned up');
assert.match(source, /router\.delete\('\/attachments\/:id'/, 'owners must have a deletion path');
assert.match(source, /Unsupported attachment type/, 'MIME allow-list must remain enforced');
assert.match(source, /Attachment exceeds/, 'size limits must remain enforced');
assert.match(source, /\/api\/chat\/attachments\//, 'attachment URLs must resolve through an authenticated API boundary');
console.log('Attachment boundary regression passed: private storage, owner binding, cleanup, deletion, validation, and non-public access are enforced.');
