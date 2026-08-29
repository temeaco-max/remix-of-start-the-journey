/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import { getAllContent, type ContentItem } from './contentManager.js';
import { listPublicTopics } from './topicService.js';

export interface AssistanceOutcomeProjection {
  type: 'assistance_outcome';
  mode: 'information' | 'support';
  query: string;
  sources: Array<{
    kind: 'resource' | 'topic';
    id: string;
    title: string;
    excerpt: string;
    destination: string;
    provenance: string;
  }>;
  nextActions: Array<{
    id: 'find_verified_help' | 'continue_support';
    label: string;
    prompt: string;
  }>;
  canonicalAction: 'assistance.content.open';
  truth: {
    sourceAttributed: true;
    noProviderClaim: true;
    noExecutionClaim: true;
  };
}

const STOP_WORDS = new Set(['about', 'after', 'also', 'could', 'does', 'from', 'have', 'help', 'how', 'into', 'need', 'please', 'should', 'that', 'the', 'this', 'what', 'when', 'where', 'with', 'would', 'your']);

function terms(query: string): string[] {
  return [...new Set(query.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(word => word.length >= 3 && !STOP_WORDS.has(word)))].slice(0, 8);
}

function excerpt(value: unknown, max = 320): string {
  const text = String(value || '').replace(/[#*_`<>]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function score(text: string, queryTerms: string[]): number {
  const haystack = text.toLowerCase();
  return queryTerms.reduce((total, term) => total + (haystack.includes(term) ? (haystack.startsWith(term) ? 3 : 1) : 0), 0);
}

function resourceDestination(item: ContentItem): string {
  return item.type === 'blog' ? `/api/blog/${encodeURIComponent(item.slug)}` : `/resources/${encodeURIComponent(item.slug)}`;
}

export async function getAssistanceOutcome(query: string): Promise<AssistanceOutcomeProjection | null> {
  const normalized = query.trim();
  const queryTerms = terms(normalized);
  if (!normalized || queryTerms.length === 0) return null;

  const [content, topics] = await Promise.all([
    getAllContent(),
    listPublicTopics({ limit: 30 }),
  ]);

  const resources = content
    .map(item => ({ item, relevance: score(`${item.title} ${item.body} ${item.type}`, queryTerms) }))
    .filter(entry => entry.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3)
    .map(({ item }) => ({
      kind: 'resource' as const,
      id: item.slug,
      title: item.title,
      excerpt: excerpt(item.body),
      destination: resourceDestination(item),
      provenance: item.type === 'help' ? 'editorial_help' : item.type === 'blog' ? 'editorial_blog' : 'editorial_content',
    }));

  const topicSources = topics
    .map((topic: any) => ({ topic, relevance: score(`${topic.title} ${topic.body} ${topic.category} ${(topic.skills || []).join(' ')}`, queryTerms) }))
    .filter(entry => entry.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 2)
    .map(({ topic }) => ({
      kind: 'topic' as const,
      id: String(topic.slug),
      title: String(topic.title),
      excerpt: excerpt(topic.body),
      destination: `/topics/${encodeURIComponent(String(topic.slug))}`,
      provenance: 'public_topic',
    }));

  const sources = [...resources, ...topicSources];
  if (!sources.length) return null;

  const supportLike = /\b(problem|issue|wrong|broken|repair|fix|order|refund|complaint|stuck|failed|scam|unsafe|help)\b/i.test(normalized);
  return {
    type: 'assistance_outcome',
    mode: supportLike ? 'support' : 'information',
    query: normalized.slice(0, 240),
    sources,
    nextActions: supportLike
      ? [{ id: 'continue_support', label: 'Continue in Chat', prompt: 'Continue with this support context and tell me what happened.' }, { id: 'find_verified_help', label: 'Find verified help', prompt: 'Find a verified person or service who can help with this.' }]
      : [{ id: 'find_verified_help', label: 'Find verified help', prompt: 'Find a verified person or service who can help with this.' }],
    canonicalAction: 'assistance.content.open',
    truth: { sourceAttributed: true, noProviderClaim: true, noExecutionClaim: true },
  };
}
