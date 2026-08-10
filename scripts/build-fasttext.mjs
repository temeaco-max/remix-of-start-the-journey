import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const modelsDir = path.join(root, 'models');
const trainingPath = path.join(modelsDir, 'intent_training_data.txt');
const outputBase = path.join(modelsDir, 'kurukoo_intent');
const binaryPath = `${outputBase}.bin`;
const generator = path.join(root, 'scripts', 'generateIntentTrainingData.mjs');

fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(trainingPath) && fs.existsSync(generator)) {
  execFileSync(process.execPath, [generator], { stdio: 'inherit' });
}
if (!fs.existsSync(trainingPath)) throw new Error('FastText training data is missing');

try {
  execFileSync('fasttext', ['supervised', '-input', trainingPath, '-output', outputBase, '-lr', '0.5', '-epoch', '25', '-wordNgrams', '2'], { stdio: 'inherit', timeout: 120000 });
} catch (error) {
  console.error('[FastText build] fasttext CLI is unavailable or training failed.');
  process.exitCode = 1;
}

if (fs.existsSync(binaryPath)) {
  const size = fs.statSync(binaryPath).size;
  if (size < 100) throw new Error(`FastText model is unexpectedly small: ${size} bytes`);
  console.log(`[FastText build] model ready: ${binaryPath} (${size} bytes)`);
}
