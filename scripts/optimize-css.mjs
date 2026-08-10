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

function optimizeCss(source) {
  const seen = new Set();
  let removed = 0;
  let i = 0;
  let output = '';

  function parseUntil(endChar = null, context = '') {
    let result = '';
    while (i < source.length) {
      const start = i;
      let quote = null;
      let paren = 0;
      while (i < source.length) {
        const ch = source[i];
        if (quote) { if (ch === '\\') i += 2; else { if (ch === quote) quote = null; i++; } continue; }
        if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
        if (ch === '(') paren++;
        if (ch === ')') paren--;
        if (paren === 0 && ch === '{') break;
        if (endChar && ch === endChar) break;
        i++;
      }
      if (i >= source.length) { result += source.slice(start); break; }
      if (endChar && source[i] === endChar) { result += source.slice(start, i + 1); i++; break; }
      const prelude = source.slice(start, i).trim();
      i++;
      const bodyStart = i;
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
      const rawBody = source.slice(bodyStart, i - 1);
      const fullContext = `${context}|${normalize(prelude)}`;

      if (prelude.startsWith('@') && rawBody.includes('{')) {
        const nestedSource = source;
        const savedSource = source;
        const nested = rawBody;
        // Recursively optimize nested rules using the same dedupe set but scoped by parent at-rule.
        const oldSource = source;
        source = nested;
        i = 0;
        const nestedOutput = parseUntil(null, fullContext);
        source = oldSource;
        result += `${prelude}{${nestedOutput}}`;
        i = bodyStart + rawBody.length + 1;
      } else {
        const cleanPrelude = normalize(stripComments(prelude));
        const cleanBody = normalize(stripComments(rawBody));
        const key = `${context}|${cleanPrelude}|${cleanBody}`;
        if (seen.has(key)) removed++;
        else { seen.add(key); result += `${prelude}{${rawBody}}`; }
      }
    }
    return result;
  }

  // The recursive parser above intentionally treats each stylesheet independently.
  // For safety, only exact duplicate rules in the same nesting context are removed.
  output = parseUntil();
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
  console.log(`${path.relative(process.cwd(), file)}: ${before} -> ${after} bytes; removed ${removed} duplicate rules`);
}
console.log(`Production CSS optimization complete. Removed ${totalRemoved} exact duplicate rules.`);
