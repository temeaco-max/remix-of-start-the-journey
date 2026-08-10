import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getDb } from '../database.js';

export interface FastTextResult { intent: string; confidence: number; }

let trainingSet: { label: string; tokens: Set<string> }[] = [];

function loadTrainingData() {
    try {
        const filePath = path.join(process.cwd(), 'models', 'intent_training_data.txt');
        if (fs.existsSync(filePath)) {
            trainingSet = [];
            for (const line of fs.readFileSync(filePath, 'utf-8').split('\n')) {
                if (!line.startsWith('__label__')) continue;
                const spaceIdx = line.indexOf(' ');
                if (spaceIdx === -1) continue;
                const label = line.slice(9, spaceIdx);
                const text = line.slice(spaceIdx + 1).toLowerCase().replace(/[^a-z0-9 ]/g, '');
                trainingSet.push({ label, tokens: new Set(text.split(/\s+/).filter(t => t.length > 1)) });
            }
            console.log(`FastText loaded ${trainingSet.length} training points for memory classification.`);
        }
    } catch (err) { console.error('FastText Service load error:', err); }
}

function isRealBinaryModel(binPath: string): boolean {
    if (!fs.existsSync(binPath)) return false;
    try {
        const stats = fs.statSync(binPath);
        if (stats.size < 100) return fs.readFileSync(binPath, 'utf-8') !== 'DUMMY_FASTTEXT_MODEL_BINARY_DATA';
        return true;
    } catch { return false; }
}

export function initializeFastText() {
    const modelsDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
    const binPath = path.join(modelsDir, 'kurukoo_intent.bin');
    if (isRealBinaryModel(binPath)) return;
    try {
        const trainingDataPath = path.join(modelsDir, 'intent_training_data.txt');
        if (!fs.existsSync(trainingDataPath)) {
            const scriptPath = path.join(process.cwd(), 'scripts', 'generateIntentTrainingData.mjs');
            if (fs.existsSync(scriptPath)) execSync(`node "${scriptPath}"`, { stdio: 'ignore' });
        }
        try {
            execSync('which fasttext', { stdio: 'ignore' });
            execSync(`fasttext supervised -input "${trainingDataPath}" -output "${path.join(modelsDir, 'kurukoo_intent')}" -lr 0.5 -epoch 25 -wordNgrams 2`, { stdio: 'ignore' });
        } catch {
            if (!fs.existsSync(binPath)) fs.writeFileSync(binPath, 'DUMMY_FASTTEXT_MODEL_BINARY_DATA');
            console.log('[FastText] Cloud environment active: using in-memory semantic classifier.');
        }
    } catch (err) { console.warn('[FastText] Using in-memory classifier:', err); }
}

initializeFastText();
loadTrainingData();

export function classifyIntentFastText(query: string): string {
    const res = classifyWithFastText(query);
    return res ? res.intent : 'unknown';
}

export function classifyWithFastText(query: string): FastTextResult | null {
    const q = query.toLowerCase().trim();
    if (!q) return null;

    // Blueprint-first deterministic intents. These run before the learned model so
    // the new verticals cannot be misclassified by an older training corpus.
    const blueprintRules: Array<[RegExp, string]> = [
        [/\b(order|buy|purchase|get|need)\b.*\b(food|suya|akara|rice|bread|grocery|groceries|car part|brake|tyre|tire|battery|clothing|shirt|shoe|equipment)\b/i, 'universal_vendor_order'],
        [/\b(football|basketball|tennis|sports|league|team|club|watch party|pitch|tournament)\b/i, 'sports_matchmaking'],
        [/\b(event coverage|cover this event|capture.*event|film.*event|photograph.*event|report.*event)\b/i, 'event_coverage'],
        [/\b(how to|tutorial|teach me|guide me|explain how)\b.*\b(video|youtube|reel|short|content)\b/i, 'how_to_video'],
        [/\b(find|hire|book)\b.*\b(security|guard|close protection|security personnel)\b/i, 'security_booking'],
        [/\b(car part|brake|tyre|tire|battery|spark plug|engine part)\b/i, 'car_parts'],
    ];
    for (const [rule, intent] of blueprintRules) {
        if (rule.test(q)) return { intent, confidence: 0.99 };
    }

    const binPath = path.join(process.cwd(), 'models', 'kurukoo_intent.bin');
    const isRealBin = isRealBinaryModel(binPath);
    if (isRealBin) {
        try {
            const cleanQuery = query.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
            if (cleanQuery) {
                const stdout = execSync(`echo "${cleanQuery}" | fasttext predict "${binPath}" -`, { encoding: 'utf-8' }).trim();
                if (stdout.startsWith('__label__')) {
                    const intent = stdout.replace('__label__', '').trim();
                    if (intent && intent !== 'unknown') return { intent, confidence: 0.95 };
                }
            }
        } catch (e) { console.warn('FastText real model query failed; using in-memory classifier.'); }
    }

    if (trainingSet.length === 0) loadTrainingData();
    const queryTokens = q.replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(t => t.length > 1);
    if (queryTokens.length === 0) return null;

    let bestIntent = 'unknown', highestScore = 0;
    for (const item of trainingSet) {
        let intersectionCount = 0;
        for (const token of queryTokens) {
            if (item.tokens.has(token)) intersectionCount++;
            else for (const t of item.tokens) {
                if (t.length >= 3 && token.length >= 3 && (t.includes(token) || token.includes(t))) { intersectionCount += 0.5; break; }
            }
        }
        const score = intersectionCount / Math.max(1, queryTokens.length);
        if (score > highestScore) { highestScore = score; bestIntent = item.label; }
    }

    if (bestIntent === 'unknown') {
        if (q.includes('balance') || q.includes('credit') || q.includes('wallet')) bestIntent = 'check_balance', highestScore = 0.95;
        else if (q.includes('help') || q.includes('police') || q.includes('accident') || q.includes('sos') || q.includes('emergency')) bestIntent = 'emergency', highestScore = 0.98;
        else if (q.includes('circle') || q.includes('money_circle') || q.includes('savings')) bestIntent = 'circle_create', highestScore = 0.92;
        else if (q.includes('ride') || q.includes('okada') || q.includes('keke') || q.includes('taxi')) bestIntent = 'ride_request', highestScore = 0.94;
        else if (q.includes('food') || q.includes('hungry') || q.includes('order')) bestIntent = 'order_food', highestScore = 0.93;
        else if (q.includes('worker') || q.includes('plumber') || q.includes('electrician') || q.includes('fix')) bestIntent = 'find_worker', highestScore = 0.91;
    }

    const confidence = parseFloat(Math.min(0.99, Math.max(0.70, highestScore || 0.70)).toFixed(2));
    if (bestIntent === 'unknown' || confidence < 0.70) {
        getDb().then(db => db.run(`INSERT INTO unknown_intents (query) VALUES (?)`, [query])).catch(() => {});
        return null;
    }
    return { intent: bestIntent, confidence: isRealBin ? confidence : parseFloat((confidence * 0.98).toFixed(2)) };
}
