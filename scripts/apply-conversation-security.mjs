import fs from 'node:fs';

const file = 'src/index.ts';
let source = fs.readFileSync(file, 'utf8');
const replacements = [
  ["app.post(['/api/chat', '/api/pwa/chat'], async (req, res) => {", "app.post(['/api/chat', '/api/pwa/chat'], authenticateUser, async (req: AuthRequest, res) => {"],
  ["app.post('/api/chat/stream', async (req, res) => {", "app.post('/api/chat/stream', authenticateUser, async (req: AuthRequest, res) => {"],
  ["app.post('/api/iot/command', async (req, res) => {", "app.post('/api/iot/command', authenticateUser, async (req: AuthRequest, res) => {"],
  ["app.get('/api/points/balance', async (req, res) => {", "app.get('/api/points/balance', authenticateUser, async (req: AuthRequest, res) => {"],
  ["app.post('/api/points/topup', async (req, res) => {", "app.post('/api/points/topup', authenticateUser, async (req: AuthRequest, res) => {"],
  ["app.get('/api/github/status', async (req, res) => {", "app.get('/api/github/status', authenticateAdmin, async (req: AuthRequest, res) => {"],
  ["app.get('/api/github/list', async (req, res) => {", "app.get('/api/github/list', authenticateAdmin, async (req: AuthRequest, res) => {"],
  ["app.get('/api/github/diff', async (req, res) => {", "app.get('/api/github/diff', authenticateAdmin, async (req: AuthRequest, res) => {"],
  ["app.post('/api/github/pull', async (req, res) => {", "app.post('/api/github/pull', authenticateAdmin, async (req: AuthRequest, res) => {"],
  ["app.post('/api/github/push', async (req, res) => {", "app.post('/api/github/push', authenticateAdmin, async (req: AuthRequest, res) => {"],
  ["const diff = await getGitHubDiff();", "const diff = await getGitHubDiff(req.query.path as string | undefined);"],
  ["const result = await pullFromGitHub();", "const result = await pullFromGitHub(req.body?.path);"],
  ["const result = await pushToGitHub(message);", "const result = await pushToGitHub(message, req.body?.path, req.body?.content);"],
  ["const JWT_SECRET = process.env.JWT_SECRET || 'kurukoo_fallback_secret_39281';\n        const token = jwt.sign", "const JWT_SECRET = process.env.JWT_SECRET;\n        if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');\n        const token = jwt.sign"],
  ["app.get('/api/messages/search', async (req, res) => {", "app.get('/api/messages/search', authenticateUser, async (req: AuthRequest, res) => {"],
  ["app.delete('/api/messages', deleteMessagesHandler);", "app.delete('/api/messages', authenticateUser, deleteMessagesHandler);"],
  ["app.post('/api/messages/delete', deleteMessagesHandler);", "app.post('/api/messages/delete', authenticateUser, deleteMessagesHandler);"],
];

for (const [from, to] of replacements) {
  if (source.includes(to)) continue;
  if (!source.includes(from)) throw new Error(`Expected source fragment not found: ${from}`);
  source = source.replace(from, to);
}

fs.writeFileSync(file, source);
console.log('Conversation/GitHub security integration applied.');
