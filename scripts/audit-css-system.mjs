import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public');
const cssFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.css')) cssFiles.push(full);
  }
}
walk(root);

const rules = new Map();
const sizes = [];
const duplicateBlocks = [];

for (const file of cssFiles) {
  const source = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  sizes.push({ file: path.relative(process.cwd(), file), bytes: Buffer.byteLength(source) });
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = re.exec(source))) {
    const selectors = match[1].trim().split(',').map(s => s.trim()).filter(Boolean);
    const body = match[2].replace(/\s+/g, ' ').trim();
    if (!body) continue;
    for (const selector of selectors) {
      const key = `${selector}|${body}`;
      const existing = rules.get(key);
      if (existing) {
        duplicateBlocks.push({ selector, body, first: existing, duplicate: path.relative(process.cwd(), file) });
      } else {
        rules.set(key, path.relative(process.cwd(), file));
      }
    }
  }
}

sizes.sort((a, b) => b.bytes - a.bytes);
console.log(`CSS files: ${cssFiles.length}`);
console.log(`CSS bytes: ${sizes.reduce((n, x) => n + x.bytes, 0).toLocaleString()}`);
console.log('Largest stylesheets:');
for (const item of sizes.slice(0, 10)) console.log(`  ${item.bytes.toLocaleString()}  ${item.file}`);

if (duplicateBlocks.length) {
  console.error(`Exact duplicate CSS blocks: ${duplicateBlocks.length}`);
  for (const item of duplicateBlocks.slice(0, 50)) console.error(`  ${item.selector} — ${item.first} == ${item.duplicate}`);
  process.exitCode = 1;
} else {
  console.log('No exact duplicate selector/declaration blocks found.');
}
