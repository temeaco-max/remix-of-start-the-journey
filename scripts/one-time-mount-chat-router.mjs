import fs from 'node:fs';

function replaceOnce(file, marker, replacement, label) {
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes(replacement.trim())) {
    if (!source.includes(marker)) throw new Error(`Expected ${label} marker not found`);
    source = source.replace(marker, replacement);
    fs.writeFileSync(file, source);
  }
}

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

const dbFile = 'src/database.ts';
let db = fs.readFileSync(dbFile, 'utf8');
const oldSave = `export function saveDb() {\n    if (!db) return;\n    const data = db.export();\n    const buffer = Buffer.from(data);\n    fs.writeFileSync(dbFilePath, buffer);\n}`;
const newSave = `let saveTimer: NodeJS.Timeout | null = null;\nconst SAVE_DEBOUNCE_MS = Math.max(50, Number(process.env.KURUKOO_DB_SAVE_DEBOUNCE_MS || 250));\n\nfunction flushDb() {\n    if (!db) return;\n    const data = db.export();\n    fs.writeFileSync(dbFilePath, Buffer.from(data));\n}\n\nexport function saveDb(immediate = false) {\n    if (!db) return;\n    if (immediate) {\n        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }\n        flushDb();\n        return;\n    }\n    if (saveTimer) return;\n    saveTimer = setTimeout(() => { saveTimer = null; flushDb(); }, SAVE_DEBOUNCE_MS);\n}\n\nprocess.once('beforeExit', () => flushDb());`;
if (!db.includes('const SAVE_DEBOUNCE_MS')) {
  if (!db.includes(oldSave)) throw new Error('Expected saveDb function marker not found');
  db = db.replace(oldSave, newSave);
  fs.writeFileSync(dbFile, db);
}
console.log('Mounted canonical chat router and coalesced SQLite persistence writes');
