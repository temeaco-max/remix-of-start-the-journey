import { classifyWithFastText, type FastTextResult } from './fastTextService.js';
import { resolveConvergedSkillBehaviour, getAllConvergedSkillNames } from './skillBehaviourConvergence.js';
import { getSkillCategoryConverged } from './skillCatalogueConvergence.js';

export interface AiRoutingSignal {
  conversationAct: string | null;
  intent: string | null;
  skill: string | null;
  category: string | null;
  confidence: number;
  source: 'rules' | 'fasttext' | 'catalogue' | 'none';
}

const ACT_PATTERNS: Array<[RegExp, string]> = [
  [/^(hi|hello|hey|hiya|howdy|greetings|good morning|good afternoon|good evening)[!,. ]*$/i, 'greeting'],
  [/^(thanks|thank you|thx|cheers|much appreciated)[!,. ]*$/i, 'thanks'],
  [/^(bye|goodbye|see you|see ya|talk later)[!,. ]*$/i, 'farewell'],
  [/^(yes|yeah|yep|yup|okay|ok|sure|alright)[!,. ]*$/i, 'confirmation'],
  [/^(no|nope|nah|not really)[!,. ]*$/i, 'rejection'],
  [/\b(i meant|i mean|actually i meant|my mistake|correction)\b/i, 'correction'],
  [/\b(can you explain|what do you mean|what does that mean|i don't understand|explain that)\b/i, 'clarification'],
  [/\b(how do i|how to|show me how|teach me how|walk me through|tutorial|guide me)\b/i, 'how_to'],
  [/\b(status|where is my|what happened to|is it booked|is it ready|any update)\b/i, 'status'],
  [/\b(cancel|stop|never mind|forget that)\b/i, 'cancel'],
];

function detectAct(text: string): string | null {
  const value = text.trim();
  for (const [pattern, act] of ACT_PATTERNS) if (pattern.test(value)) return act;
  return null;
}

function normalizeFastTextSkill(intent: string | undefined): string | null {
  if (!intent) return null;
  const prefix = 'skill_route_';
  if (intent.startsWith(prefix)) {
    const candidate = intent.slice(prefix.length);
    return getAllConvergedSkillNames().includes(candidate) ? candidate : null;
  }
  return getAllConvergedSkillNames().includes(intent) ? intent : null;
}

function catalogueSkill(text: string): string | null {
  const lower = text.toLowerCase();
  const deviceRules: Array<[RegExp, string]> = [
    [/\b(?:iphone|android|smartphone|mobile phone|cell phone)\b/i, 'phone_repairer'],
    [/\b(?:laptop|macbook|mac book|dell|lenovo|hp laptop|notebook)\b/i, 'laptop_repairer'],
    [/\b(?:tablet|ipad|galaxy tab|surface)\b/i, 'tablet_repairer'],
    [/\b(?:ps5|ps4|xbox|nintendo switch|playstation)\b/i, 'console_repairer'],
    [/\b(?:television|smart tv|tv)\b/i, 'tv_repairer'],
    [/\b(?:apple watch|galaxy watch|garmin|fitbit)\b/i, 'smartwatch_repairer'],
    [/\b(?:airpods|airpod|galaxy buds|wireless earbuds)\b/i, 'earbuds_repairer'],
    [/\b(?:bluetooth speaker|bose speaker|jbl speaker|wireless speaker)\b/i, 'speaker_repairer'],
    [/\b(?:washing machine|fridge|refrigerator|oven|dishwasher)\b/i, 'appliance_repairer'],
    [/\b(?:bicycle|bike)\b/i, 'bicycle_repairer'],
    [/\b(?:motorbike|motorcycle)\b/i, 'motorbike_repairer'],
  ];
  const repairing = /\b(?:repair|broken|damaged|cracked|screen|fix|not working|won't turn on|not charging|fault)\b/i.test(lower);
  if (repairing) for (const [pattern, skill] of deviceRules) if (pattern.test(lower) && getAllConvergedSkillNames().includes(skill)) return skill;
  const pack = resolveConvergedSkillBehaviour(text);
  if (pack) return pack.skill;
  for (const name of getAllConvergedSkillNames()) {
    const phrase = name.replace(/_/g, ' ').toLowerCase();
    if (phrase.length >= 4 && lower.includes(phrase)) return name;
  }
  return null;
}

export function classifyAiRoutingSignal(text: string): AiRoutingSignal {
  const act = detectAct(text);
  if (act) return { conversationAct: act, intent: act, skill: null, category: null, confidence: 0.999, source: 'rules' };
  const fast: FastTextResult | null = classifyWithFastText(text);
  const fastSkill = normalizeFastTextSkill(fast?.intent);
  const skill = catalogueSkill(text);
  const authoritativeSkill = skill || fastSkill;
  const intent = authoritativeSkill || fast?.intent || null;
  const category = authoritativeSkill ? getSkillCategoryConverged(authoritativeSkill) : null;
  if (fast && authoritativeSkill) return { conversationAct: null, intent: authoritativeSkill, skill: authoritativeSkill, category, confidence: Math.max(fast.confidence, 0.93), source: skill ? 'catalogue' : fast.source === 'rules' ? 'rules' : 'fasttext' };
  if (fast) return { conversationAct: null, intent: fast.intent, skill: null, category: null, confidence: fast.confidence, source: fast.source === 'rules' ? 'rules' : 'fasttext' };
  if (authoritativeSkill) return { conversationAct: null, intent: authoritativeSkill, skill: authoritativeSkill, category, confidence: 0.95, source: 'catalogue' };
  return { conversationAct: null, intent: null, skill: null, category: null, confidence: 0, source: 'none' };
}

export function shouldEscalateToAi(signal: AiRoutingSignal, text: string): boolean {
  if (signal.conversationAct && ['greeting', 'thanks', 'farewell', 'confirmation', 'rejection'].includes(signal.conversationAct)) return false;
  if (signal.source === 'none') return true;
  if (signal.confidence < 0.72) return true;
  if (/\b(why|compare|which is better|negotiate|arrange|coordinate|same[- ]day|multiple|instead|actually|what are my options)\b/i.test(text)) return true;
  return false;
}
