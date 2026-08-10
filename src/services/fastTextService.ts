import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { getDb } from '../database.js';

export interface FastTextResult { intent: string; confidence: number; source?: 'fasttext' | 'rules' | 'fallback'; }

let trainingSet: { label: string; tokens: Set<string> }[] = [];
let fastTextReady = false;

function modelPath(): string {
    return path.join(process.cwd(), 'models', 'kurukoo_intent.bin');
}

function trainingPath(): string {
    return path.join(process.cwd(), 'models', 'intent_training_data.txt');
}

function isRealBinaryModel(binPath: string): boolean {
    try {
        if (!fs.existsSync(binPath)) return false;
        const stats = fs.statSync(binPath);
        if (stats.size < 100) return false;
        const header = fs.readFileSync(binPath).subarray(0, 16).toString('utf8');
        return !header.includes('DUMMY_FASTTEXT');
    } catch {
        return false;
    }
}

function loadTrainingData(): void {
    try {
        const filePath = trainingPath();
        if (!fs.existsSync(filePath)) return;
        trainingSet = [];
        for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
            if (!line.startsWith('__label__')) continue;
            const spaceIdx = line.indexOf(' ');
            if (spaceIdx === -1) continue;
            const label = line.slice(9, spaceIdx).trim();
            const text = line.slice(spaceIdx + 1).toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
            trainingSet.push({
                label,
                tokens: new Set(text.split(/\s+/).filter(token => token.length > 1))
            });
        }
        console.log(`[FastText] loaded ${trainingSet.length} training examples`);
    } catch (err) {
        console.error('[FastText] training-data load failed:', err);
    }
}

export function initializeFastText(): void {
    const modelsDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

    const binPath = modelPath();
    if (isRealBinaryModel(binPath)) {
        fastTextReady = true;
        loadTrainingData();
        console.log(`[FastText] model ready: ${binPath}`);
        return;
    }

    try {
        const scriptPath = path.join(process.cwd(), 'scripts', 'generateIntentTrainingData.mjs');
        if (!fs.existsSync(trainingPath()) && fs.existsSync(scriptPath)) {
            execFileSync(process.execPath, [scriptPath], { stdio: 'ignore' });
        }

        if (fs.existsSync(trainingPath())) {
            try {
                execFileSync('fasttext', [
                    'supervised',
                    '-input', trainingPath(),
                    '-output', path.join(modelsDir, 'kurukoo_intent'),
                    '-lr', '0.5',
                    '-epoch', '25',
                    '-wordNgrams', '2'
                ], { stdio: 'ignore' });
            } catch {
                console.warn('[FastText] CLI unavailable; using deterministic fallback classifier.');
            }
        }
    } catch (err) {
        console.warn('[FastText] initialization failed; using fallback classifier:', err);
    }

    fastTextReady = isRealBinaryModel(binPath);
    loadTrainingData();
    console.log(`[FastText] ready=${fastTextReady}, trainingExamples=${trainingSet.length}`);
}

initializeFastText();

const blueprintRules: Array<[RegExp, string]> = [
    [/\b(ride|okada|keke|taxi|cab|transport|driver)\b/i, 'ride_request'],
    [/\b(food|suya|rice|bread|grocery|groceries|meal|restaurant|caterer)\b/i, 'order_food'],
    [/\b(plumber|electrician|mechanic|repair|fix|artisan|worker)\b/i, 'find_worker'],
    [/\b(balance|points|wallet|credit)\b/i, 'check_balance'],
    [/\b(emergency|sos|police|accident|hospital)\b/i, 'emergency'],
    [/\b(football|basketball|tennis|league|team|club|tournament|watch party)\b/i, 'sports_matchmaking'],
    [/\b(event coverage|cover this event|photograph.*event|film.*event)\b/i, 'event_coverage'],
    [/\b(how to|tutorial|teach me|guide me)\b/i, 'how_to_video'],
    [/\b(security|guard|close protection)\b/i, 'security_booking']
];

function ruleClassify(q: string): FastTextResult | null {
    for (const [rule, intent] of blueprintRules) {
        if (rule.test(q)) return { intent, confidence: 0.99, source: 'rules' };
    }
    return null;
}

function classifyWithBinaryModel(query: string): FastTextResult | null {
    if (!fastTextReady) return null;
    try {
        const clean = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!clean) return null;
        const stdout = execFileSync('fasttext', ['predict-prob', modelPath(), '-'], {
            input: `${clean}\n`,
            encoding: 'utf8',
            timeout: 2500
        }).trim();
        const match = stdout.match(/__label__([^\s]+)\s+([0-9.]+)/);
        if (!match) return null;
        const confidence = Number(match[2]);
        const intent = match[1];
        console.info(`[FastText] query="${query}" intent=${intent} confidence=${confidence.toFixed(3)} source=model`);
        return { intent, confidence, source: 'fasttext' };
    } catch (err: any) {
        console.warn('[FastText] prediction failed:', err?.message || err);
        return null;
    }
}

function classifyWithMemory(query: string): FastTextResult | null {
    if (!trainingSet.length) return null;
    const tokens = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t.length > 1);
    if (!tokens.length) return null;

    let best = 'unknown';
    let score = 0;
    for (const item of trainingSet) {
        let hits = 0;
        for (const token of tokens) {
            if (item.tokens.has(token)) hits += 1;
            else if ([...item.tokens].some(t => t.length >= 4 && token.length >= 4 && (t.includes(token) || token.includes(t)))) hits += 0.5;
        }
        const candidate = hits / tokens.length;
        if (candidate > score) {
            score = candidate;
            best = item.label;
        }
    }
    if (best === 'unknown' || score < 0.35) return null;
    const result = { intent: best, confidence: Math.min(0.95, Math.max(0.70, score)), source: 'fallback' as const };
    console.info(`[FastText] query="${query}" intent=${result.intent} confidence=${result.confidence.toFixed(3)} source=memory`);
    return result;
}

export function classifyWithFastText(query: string): FastTextResult | null {
    const q = query.trim();
    if (!q) return null;

    const rule = ruleClassify(q);
    if (rule) {
        console.info(`[FastText] query="${q}" intent=${rule.intent} confidence=${rule.confidence.toFixed(3)} source=rules`);
        return rule;
    }

    const model = classifyWithBinaryModel(q);
    if (model) return model;

    const memory = classifyWithMemory(q);
    if (memory) return memory;

    getDb().then(db => db.run(`INSERT INTO unknown_intents (query) VALUES (?)`, [q])).catch(() => {});
    console.info(`[FastText] query="${q}" intent=unknown source=fallback`);
    return null;
}

export function classifyIntentFastText(query: string): string {
    return classifyWithFastText(query)?.intent || 'unknown';
}
