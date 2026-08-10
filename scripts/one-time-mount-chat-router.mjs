import fs from 'node:fs';

const file = 'src/index.ts';
let source = fs.readFileSync(file, 'utf8');
const importMarker = "import fcmRouter from './server.js';";
const importLine = "import chatRouter from './routes/chatRouter.js';";
if (!source.includes(importLine)) {
  if (!source.includes(importMarker)) throw new Error('Expected server import marker not found');
  source = source.replace(importMarker, `${importMarker}\n${importLine}`);
}
const parserMarker = "app.use(express.json());\napp.use(express.urlencoded({ extended: true }));";
const parserReplacement = "app.use('/api/chat/attachments', express.json({ limit: process.env.CHAT_ATTACHMENT_BODY_LIMIT || '35mb' }));\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\n\n// Canonical conversation surface. This router owns the production chat history, streaming, and attachments.\napp.use('/api/chat', chatRouter);";
if (!source.includes("app.use('/api/chat', chatRouter);")) {
  if (!source.includes(parserMarker)) throw new Error('Expected body parser marker not found');
  source = source.replace(parserMarker, parserReplacement);
}
fs.writeFileSync(file, source);
console.log('Mounted canonical chat router');
