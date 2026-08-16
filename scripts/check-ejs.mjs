import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';

const root = path.resolve('views');
const failures = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ejs')) {
      try { ejs.compile(fs.readFileSync(full, 'utf8'), { filename: full }); }
      catch (error) { failures.push({ file: path.relative(process.cwd(), full), message: error?.message || String(error) }); }
    }
  }
}
walk(root);
console.log(JSON.stringify({ checked: failures.length ? 'with_failures' : 'ok', failures }, null, 2));
if (failures.length) process.exitCode = 1;
