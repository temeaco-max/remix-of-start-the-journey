import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { getDb } from '../database.js';

export interface FastTextResult { intent: string; confidence: number; source?: 'fasttext' | 'rules' | 'fallback'; }
export type FastTextModelState = 'real' | 'missing' | 'invalid';
export interface FastTextRuntimeStatus {
    modelState: FastTextModelState;
    realModelPresent: boolean;
    modelPath: string;
    trainingExamples: number;
}

let trainingSet: { label: string; tokens: Set<string> }[] = [];
let fastTextReady = false;
const classificationCache = new Map<string, { result: FastTextResult | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MODEL_MIN_CONFIDENCE = 0.55;

function modelPath(): string { return path.join(process.cwd(), 'models', 'kurukoo_intent.bin'); }
function trainingPath(): string { return path.join(process.cwd(), 'models', 'intent_training_data.txt'); }
function normalize(query: string): string { return query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

function isRealBinaryModel(binPath: string): boolean {
    try {
        if (!fs.existsSync(binPath)) return false;
        const stats = fs.statSync(binPath);
        if (stats.size < 100) return false;
        return !fs.readFileSync(binPath).subarray(0, 32).toString('utf8').includes('DUMMY_FASTTEXT');
    } catch { return false; }
}

function getModelState(binPath: string): FastTextModelState {
    if (!fs.existsSync(binPath)) return 'missing';
    return isRealBinaryModel(binPath) ? 'real' : 'invalid';
}

export function getFastTextRuntimeStatus(rootDir = process.cwd()): FastTextRuntimeStatus {
    const binPath = path.join(rootDir, 'models', 'kurukoo_intent.bin');
    const modelState = getModelState(binPath);
    return {
        modelState,
        realModelPresent: modelState === 'real',
        modelPath: binPath,
        trainingExamples: trainingSet.length,
    };
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
            const tokens = new Set(normalize(line.slice(spaceIdx + 1)).split(/\s+/).filter(token => token.length > 1));
            trainingSet.push({ label, tokens });
        }
        console.log(`[FastText] loaded ${trainingSet.length} training examples`);
    } catch (err) { console.error('[FastText] training-data load failed:', err); }
}

/**
 * Runtime initialization is deliberately cheap. Model training belongs in CI/build
 * and must never block the application process or a cold start.
 */
export function initializeFastText(): void {
    classificationCache.clear();
    fastTextReady = isRealBinaryModel(modelPath());
    loadTrainingData();
    const status = getFastTextRuntimeStatus();
    console.log(`[FastText] modelState=${status.modelState}, ready=${fastTextReady}, trainingExamples=${trainingSet.length}`);
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
    for (const [rule, intent] of blueprintRules) if (rule.test(q)) return { intent, confidence: 0.99, source: 'rules' };
    return null;
}

function classifyWithBinaryModel(query: string): FastTextResult | null {
    if (!fastTextReady) return null;
    const clean = normalize(query);
    if (!clean) return null;
    const inputPath = path.join(os.tmpdir(), `kurukoo-fasttext-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
    try {
        fs.writeFileSync(inputPath, `${clean}\n`, { mode: 0o600 });
        const stdout = execFileSync('fasttext', ['predict-prob', modelPath(), inputPath, '1'], { encoding: 'utf8', timeout: 2500 }).trim();
        const match = stdout.match(/__label__([^\s]+)\s+([0-9.]+)/);
        if (!match) return null;
        const confidence = Number(match[2]);
        if (!Number.isFinite(confidence) || confidence < MODEL_MIN_CONFIDENCE) return null;
        return { intent: match[1], confidence, source: 'fasttext' };
    } catch (err: any) {
        console.warn('[FastText] prediction failed:', err?.message || err);
        return null;
    } finally {
        try { fs.unlinkSync(inputPath); } catch { /* best effort */ }
    }
}

function classifyWithMemory(query: string): FastTextResult | null {
    if (!trainingSet.length) return null;
    const tokens = normalize(query).split(/\s+/).filter(t => t.length > 1);
    if (!tokens.length) return null;
    let best = 'unknown'; let score = 0;
    for (const item of trainingSet) {
        let hits = 0;
        for (const token of tokens) {
            if (item.tokens.has(token)) hits += 1;
            else if ([...item.tokens].some(t => t.length >= 4 && token.length >= 4 && (t.includes(token) || token.includes(t)))) hits += 0.5;
        }
        const candidate = hits / tokens.length;
        if (candidate > score) { score = candidate; best = item.label; }
    }
    if (best === 'unknown' || score < 0.35) return null;
    return { intent: best, confidence: Math.min(0.95, Math.max(0.70, score)), source: 'fallback' };
}

function correctKnownDomainCollision(query: string, result: FastTextResult | null): FastTextResult | null {
    if (/\b(advertis(?:e|ing)?|advert|campaign|sponsored|promotion|promote)\b/i.test(query) && result?.intent !== 'advertising') {
        return { intent: 'advertising', confidence: 0.99, source: 'rules' };
    }
    return result;
}

export function classifyWithFastText(query: string): FastTextResult | null {
    const q = query.trim();
    if (!q) return null;
    const key = normalize(q);
    const cached = classificationCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.result;

    // The real FastText model is always preferred. Rules are a deterministic safety
    // net for action intents, followed by the training-data fallback when the binary
    // model is unavailable in a development environment.
    const result = correctKnownDomainCollision(q, classifyWithBinaryModel(q) || ruleClassify(q) || classifyWithMemory(q));
    if (classificationCache.size > 2000) classificationCache.delete(classificationCache.keys().next().value as string);
    classificationCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });

    if (result) console.info(`[FastText] query="${q}" intent=${result.intent} confidence=${result.confidence.toFixed(3)} source=${result.source}`);
    else {
        getDb().then(db => db.run(`INSERT INTO unknown_intents (query) VALUES (?)`, [q])).catch(() => {});
        console.info(`[FastText] query="${q}" intent=unknown source=fallback`);
    }
    return result;
}

export function classifyIntentFastText(query: string): string { return classifyWithFastText(query)?.intent || 'unknown'; }
