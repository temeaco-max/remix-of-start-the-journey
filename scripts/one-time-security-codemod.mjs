import fs from 'node:fs';
const file='src/index.ts';
let s=fs.readFileSync(file,'utf8');
s=s.replace("const adminPass = process.env.ADMIN_PASSWORD || 'kurukoo2026';", "const adminPass = process.env.ADMIN_PASSWORD;\n    if (!adminPass) return res.status(503).json({ success: false, error: 'Admin authentication is not configured' });");
s=s.replace("const JWT_SECRET = process.env.JWT_SECRET || 'kurukoo_fallback_secret_39281';", "const JWT_SECRET = process.env.JWT_SECRET;\n    if (!JWT_SECRET || JWT_SECRET.length < 32) return res.status(503).json({ success: false, error: 'JWT authentication is not configured' });");
if (!s.includes("app.set('trust proxy', 1);")) s=s.replace("const app = express();", "const app = express();\napp.set('trust proxy', 1);");
fs.writeFileSync(file,s);
