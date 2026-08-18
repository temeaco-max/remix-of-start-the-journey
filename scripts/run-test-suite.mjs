import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const suiteName = process.argv[2];
if (!suiteName) {
  console.error('Usage: node scripts/run-test-suite.mjs <npm-script-name>');
  process.exit(2);
}

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const suite = packageJson.scripts?.[suiteName];
if (typeof suite !== 'string' || !suite.trim()) {
  console.error(`Unknown npm suite: ${suiteName}`);
  process.exit(2);
}

const commands = suite.split(/\s+&&\s+/).map(command => command.trim()).filter(Boolean);
let firstFailure = 0;
for (const command of commands) {
  const match = command.match(/^npm run ([A-Za-z0-9:_-]+)$/);
  if (!match) {
    console.error(`Unsupported suite command: ${command}`);
    process.exit(2);
  }
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', match[1]], {
    stdio: 'inherit',
    env: process.env,
  });
  const code = result.error ? 1 : (typeof result.status === 'number' ? result.status : 1);
  if (code !== 0) {
    firstFailure ||= code;
    console.error(`\nSuite ${suiteName} stopped at ${match[1]} with exit code ${code}.`);
    process.exit(firstFailure);
  }
}
console.log(`\nSuite ${suiteName} passed ${commands.length} commands.`);
process.exit(0);
