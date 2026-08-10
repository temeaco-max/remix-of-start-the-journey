import fs from 'node:fs';
import path from 'node:path';

const root = fs.existsSync(path.resolve('dist/public')) ? path.resolve('dist/public') : path.resolve('public');
const cssFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.css')) cssFiles.push(full);
  }
}
function stripComments(value) { return value.replace(/\/\*[\s\S]*?\*\//g, ''); }
function normalize(value) { return value.replace(/\s+/g, ' ').trim(); }

const rules = new Map();
const sizes = [];
const duplicateBlocks = [];

for (const file of cssFiles) {
  const source = fs.readFileSync(file, 'utf8');
  sizes.push({ file: path.relative(process.cwd(), file), bytes: Buffer.byteLength(source) });
  let i = 0;
  while (i < source.length) {
    const start = i;
    let quote = null;
    let paren = 0;
    let brace = -1;
    while (i < source.length) {
      const ch = source[i];
      if (quote) { if (ch === '\\') i += 2; else { if (ch === quote) quote = null; i++; } continue; }
      if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
      if (ch === '(') paren++;
      else if (ch === ')') paren--;
      else if (paren === 0 && ch === '{') { brace = i; break; }
      i++;
    }
    if (brace < 0) break;
    const prelude = source.slice(start, brace).trim();
    i = brace + 1;
    let depth = 1;
    quote = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (quote) { if (ch === '\\') i += 2; else { if (ch === quote) quote = null; i++; } continue; }
      if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }
    const body = source.slice(brace + 1, i - 1);
    // Nested at-rules are intentionally excluded; they are scoped and preserved byte-for-byte.
    if (prelude.startsWith('@')) continue;
    const key = `${normalize(stripComments(prelude))}|${normalize(stripComments(body))}`;
    const relative = path.relative(process.cwd(), file);
    if (rules.has(key)) duplicateBlocks.push({ selector: normalize(prelude), first: rules.get(key), duplicate: relative });
    else rules.set(key, relative);
  }
}

sizes.sort((a, b) => b.bytes - a.bytes);
console.log(`CSS files audited: ${cssFiles.length}`);
console.log(`Production CSS bytes: ${sizes.reduce((n, x) => n + x.bytes, 0).toLocaleString()}`);
for (const item of sizes.slice(0, 10)) console.log(`  ${item.bytes.toLocaleString()}  ${item.file}`);

if (duplicateBlocks.length) {
  console.error(`Exact duplicate top-level CSS blocks: ${duplicateBlocks.length}`);
  for (const item of duplicateBlocks.slice(0, 50)) console.error(`  ${item.selector} — ${item.first} == ${item.duplicate}`);
  process.exitCode = 1;
} else console.log('No exact duplicate top-level CSS blocks found in production output.');
