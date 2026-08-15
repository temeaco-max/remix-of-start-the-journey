import { getGenAIClient, GeminiProviderError } from './geminiService.js';

export interface TtsResult {
  mime: string;
  data: Buffer;
}

function ttsModel(): string {
  return process.env.KURUKOO_VOICE_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
}

/** Server TTS is truthfully reported as available only when explicitly enabled and configured. */
export function isTtsEnabled(): boolean {
  return (process.env.KURUKOO_VOICE_TTS_PROVIDER || 'disabled') !== 'disabled'
    && Boolean(ttsModel())
    && Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
}

/** Gemini turn-based server TTS. Returns an audio buffer and its mime type. */
export async function synthesizeSpeech(input: string): Promise<TtsResult> {
  const text = String(input || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 600);
  if (!text) throw new GeminiProviderError('GEMINI_REQUEST_FAILED', 'Text-to-speech requires non-empty text.');
  if (!isTtsEnabled()) throw new GeminiProviderError('GEMINI_NOT_CONFIGURED', 'Server TTS is not configured for this deployment.');

  try {
    const response = await getGenAIClient().models.generateContent({
      model: ttsModel(),
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      },
    });
    const audio = response?.candidates?.[0]?.content?.parts?.find((part: any) => part?.inlineData?.data);
    if (!audio?.inlineData?.data) throw new GeminiProviderError('GEMINI_EMPTY_RESPONSE', 'Gemini TTS returned no audio.');
    return {
      mime: audio.inlineData.mimeType || 'audio/wav',
      data: Buffer.from(audio.inlineData.data, 'base64'),
    };
  } catch (error) {
    if (error instanceof GeminiProviderError) throw error;
    throw new GeminiProviderError('GEMINI_REQUEST_FAILED', 'Gemini TTS request failed.', { cause: error });
  }
}