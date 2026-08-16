import { listChatMessages } from './chatConversationService.js';

export interface ConversationContextPack {
  threadId?: string;
  transcript: string;
  turns: number;
  tokenEstimate: number;
}

function sanitizeContent(value: unknown): string {
  return String(value || '')
    .replace(/<\|im_(?:start|end)\|>/g, '')
    .replace(/\b(?:system prompt|internal conversation orientation|living memory|memory_facts|stable:|episodic:|open_intention|recent_tail)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

/**
 * Returns only the recent human-facing transcript for the exact conversation.
 * Cards, metadata and implementation details are intentionally excluded.
 */
export async function buildConversationContextPack(
  phone: string | undefined,
  threadId: string | undefined,
  currentUserMessage: string,
  options: { maxTurns?: number; maxTokens?: number } = {},
): Promise<ConversationContextPack> {
  if (!phone || !threadId) return { threadId, transcript: '', turns: 0, tokenEstimate: 0 };

  const maxTurns = Math.min(Math.max(options.maxTurns || 8, 2), 12);
  const maxTokens = Math.min(Math.max(options.maxTokens || 1200, 300), 2000);
  try {
    const rows = await listChatMessages(phone, { conversationId: threadId, limit: maxTurns + 2 });
    const lines: string[] = [];
    let tokens = 0;

    for (const row of rows.slice(-maxTurns)) {
      const sender = row?.sender === 'assistant' ? 'Kurukoo' : row?.sender === 'user' ? 'User' : '';
      const content = sanitizeContent(row?.content);
      if (!sender || !content) continue;
      const line = `${sender}: ${content}`;
      const estimate = Math.ceil(line.length / 4);
      if (tokens + estimate > maxTokens) break;
      lines.push(line);
      tokens += estimate;
    }

    const current = sanitizeContent(currentUserMessage);
    if (current) {
      const currentLine = `User: ${current}`;
      const alreadyPresent = lines[lines.length - 1] === currentLine;
      if (!alreadyPresent) {
        const estimate = Math.ceil(currentLine.length / 4);
        if (tokens + estimate <= maxTokens) {
          lines.push(currentLine);
          tokens += estimate;
        }
      }
    }

    return { threadId, transcript: lines.join('\n'), turns: lines.length, tokenEstimate: tokens };
  } catch {
    return { threadId, transcript: '', turns: 0, tokenEstimate: 0 };
  }
}
