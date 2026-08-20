import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const modelsDir = path.join(root, 'models');
const baseTrainingPath = path.join(modelsDir, 'intent_training_data.txt');
const behaviourTrainingPath = path.join(modelsDir, 'intent_training_behaviour_additions.txt');
const skillHintPath = path.join(modelsDir, 'intent_training_skill_hints.txt');
const mergedTrainingPath = path.join(modelsDir, '.intent_training_data.merged.txt');
const outputBase = path.join(modelsDir, 'kurukoo_intent');
const binaryPath = `${outputBase}.bin`;
const generator = path.join(root, 'scripts', 'generateIntentTrainingData.mjs');
const skillHintGenerator = path.join(root, 'scripts', 'generate-fasttext-skill-hints.ts');

fs.mkdirSync(modelsDir, { recursive: true });
if (!fs.existsSync(baseTrainingPath) && fs.existsSync(generator)) execFileSync(process.execPath, [generator], { stdio: 'inherit' });
if (fs.existsSync(skillHintGenerator)) execFileSync('npx', ['tsx', skillHintGenerator], { stdio: 'inherit' });
if (!fs.existsSync(baseTrainingPath)) throw new Error('FastText training data is missing');

const base = fs.readFileSync(baseTrainingPath, 'utf8').trim();
const additions = fs.existsSync(behaviourTrainingPath) ? fs.readFileSync(behaviourTrainingPath, 'utf8').trim() : '';
const skillHints = fs.existsSync(skillHintPath) ? fs.readFileSync(skillHintPath, 'utf8').trim() : '';
fs.writeFileSync(mergedTrainingPath, `${base}\n${additions}\n${skillHints}\n`, 'utf8');

try {
  execFileSync('fasttext', [
    'supervised', '-input', mergedTrainingPath, '-output', outputBase,
    '-lr', '0.75', '-epoch', '80', '-wordNgrams', '2', '-dim', '75',
    '-bucket', '20000', '-minn', '1', '-maxn', '3', '-thread', '1'
  ], { stdio: 'inherit', timeout: 180000 });
} catch (error) {
  console.error('[FastText build] fasttext CLI is unavailable or training failed.');
  process.exitCode = 1;
}

try { fs.unlinkSync(mergedTrainingPath); } catch {}
if (fs.existsSync(binaryPath)) {
  const size = fs.statSync(binaryPath).size;
  if (size < 100) throw new Error(`FastText model is unexpectedly small: ${size} bytes`);
  const vectorPath = `${outputBase}.vec`;
  if (fs.existsSync(vectorPath)) fs.unlinkSync(vectorPath);
  console.log(`[FastText build] model ready: ${binaryPath} (${size} bytes)`);
}
