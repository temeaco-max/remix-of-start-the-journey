import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist/public');
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.css')) files.push(full);
  }
}
function stripComments(value) { return value.replace(/\/\*[\s\S]*?\*\//g, ''); }
function normalize(value) { return value.replace(/\s+/g, ' ').trim(); }

// Conservative optimizer: only removes exact duplicate top-level rules.
// Nested @media/@supports/keyframes blocks are copied byte-for-byte so responsive
// behavior and animation scoping cannot be changed by an optimization pass.
function optimizeCss(source) {
  const seen = new Set();
  let removed = 0;
  let i = 0;
  let output = '';

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
    if (brace < 0) { output += source.slice(start); break; }

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
    const whole = source.slice(start, i);

    if (prelude.startsWith('@')) {
      output += whole;
      continue;
    }

    const key = `${normalize(stripComments(prelude))}|${normalize(stripComments(body))}`;
    if (seen.has(key)) removed++;
    else { seen.add(key); output += whole; }
  }
  return { output, removed };
}

walk(root);
let totalRemoved = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const before = Buffer.byteLength(source);
  const { output, removed } = optimizeCss(source);
  fs.writeFileSync(file, output);
  const after = Buffer.byteLength(output);
  totalRemoved += removed;
  console.log(`${path.relative(process.cwd(), file)}: ${before} -> ${after} bytes; removed ${removed} exact duplicate top-level rules`);
}
console.log(`Production CSS optimization complete. Removed ${totalRemoved} exact duplicate top-level rules.`);
