import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'src/services');
const files = fs.readdirSync(dir).filter(file => file.endsWith('.ts'));
const suspicious = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(dir, file), 'utf8');
  const matches = [...source.matchAll(/\b(stub|fake|dummy|pending_stub|coming soon)\b/gi)];
  if (matches.length) suspicious.push({ file, matches: matches.length });
}

console.log(JSON.stringify({ serviceCount: files.length, suspicious }, null, 2));

// Stubs are allowed only when explicitly documented as conditional integrations;
// this audit is intentionally informational so it does not block unrelated builds.
