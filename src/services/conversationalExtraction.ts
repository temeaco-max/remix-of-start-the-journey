import { getKnownSkills } from './skillFlows.js';

export interface ConversationalEntities {
  intent?: string;
  skill?: string;
  location?: string;
  date?: string;
  time?: string;
  budget?: number;
  quantity?: number;
  product?: string;
  preferences?: string[];
  provider?: string;
  requestContext?: string;
}

const SKILL_ALIASES: Array<[RegExp, string]> = [
  [/\bpaint(?:er|ing)?\b/i, 'painter'],
  [/\bplumb(?:er|ing)?\b/i, 'plumber'],
  [/\belectric(?:ian|al)?\b/i, 'electrician'],
  [/\bcarpenter\b/i, 'carpenter'],
  [/\bclean(?:er|ing)?\b/i, 'cleaner'],
  [/\b(?:taxi|cab|ride|uber)\b/i, 'ride_request'],
  [/\b(?:jollof|fried rice|food|meal|groceries)\b/i, 'order_food'],
];

function clean(value: string | undefined): string | undefined {
  const result = value?.replace(/[.!?,;:]+$/, '').trim();
  return result || undefined;
}

function parseBudget(text: string): number | undefined {
  const match = text.match(/(?:₦|ngn|naira)\s*([\d,]+)|\b([\d,]+)\s*(?:ngn|naira|k)\b/i);
  if (!match) return undefined;
  const value = Number((match[1] || match[2] || '').replace(/,/g, ''));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return /\bk\b/i.test(match[0]) ? value * 1000 : value;
}

function parseLocation(text: string): string | undefined {
  const explicit = text.match(/\b(?:in|at|near|around|within)\s+([A-Za-z][A-Za-z .'-]{1,50}?)(?=\s+(?:on|next|this|tomorrow|today|for|with|and|budget|around|within)|[,.!?]|$)/i)?.[1];
  if (explicit) return clean(explicit);
  const known = ['ikeja', 'lekki', 'yaba', 'ibadan', 'abuja', 'surulere', 'victoria island', 'port harcourt'];
  return known.find(location => new RegExp(`\\b${location.replace(' ', '\\s+')}\\b`, 'i').test(text));
}

function parseDateTime(text: string): { date?: string; time?: string } {
  const date = text.match(/\b(next\s+(?:weekend|saturday|sunday)|this\s+weekend|tomorrow|today|saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b/i)?.[1];
  const time = text.match(/\b(morning|afternoon|evening|night|\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i)?.[1];
  return { date: clean(date), time: clean(time) };
}

function parseQuantity(text: string): number | undefined {
  const match = text.match(/\b(?:for|x|quantity(?: of)?)\s*(\d+)\b/i);
  return match ? Number(match[1]) : undefined;
}

function parseProduct(text: string): string | undefined {
  const match = text.match(/\b(?:buy|purchase|order|get|source)\s+(.+?)(?=\s+(?:in|at|near|for|tomorrow|today|on|with|around)\b|[.!?]|$)/i);
  return clean(match?.[1]);
}

function parsePreferences(text: string): string[] | undefined {
  const preferences: string[] = [];
  if (/\bprefer\b.*\b(short|brief|concise|simple)\b/i.test(text)) preferences.push('response_style:concise');
  if (/\bprefer\b.*\bevenings?\b/i.test(text)) preferences.push('time_preference:evening');
  if (/\bprefer\b.*\bmornings?\b/i.test(text)) preferences.push('time_preference:morning');
  return preferences.length ? preferences : undefined;
}

export function extractConversationalEntities(text: string, intent?: string): ConversationalEntities {
  const query = String(text || '').trim();
  const skill = SKILL_ALIASES.find(([pattern]) => pattern.test(query))?.[1] || getKnownSkills().find(candidate => query.toLowerCase().includes(candidate.replace(/_/g, ' ')));
  const dateTime = parseDateTime(query);
  const entities: ConversationalEntities = {
    intent,
    skill,
    location: parseLocation(query),
    date: dateTime.date,
    time: dateTime.time,
    budget: parseBudget(query),
    quantity: parseQuantity(query),
    product: parseProduct(query),
    preferences: parsePreferences(query),
    requestContext: query,
  };
  return Object.fromEntries(Object.entries(entities).filter(([, value]) => value !== undefined && value !== '')) as ConversationalEntities;
}

export function validateConversationalEntities(entities: ConversationalEntities, intent?: string): ConversationalEntities {
  const validated: ConversationalEntities = { ...entities, intent: intent || entities.intent };
  if (validated.budget !== undefined && (!Number.isFinite(validated.budget) || validated.budget < 0 || validated.budget > 1_000_000_000)) delete validated.budget;
  if (validated.quantity !== undefined && (!Number.isInteger(validated.quantity) || validated.quantity < 1 || validated.quantity > 10000)) delete validated.quantity;
  if (validated.location) validated.location = validated.location.slice(0, 80);
  if (validated.product) validated.product = validated.product.slice(0, 160);
  if (validated.skill && validated.skill.length > 80) delete validated.skill;
  return validated;
}
