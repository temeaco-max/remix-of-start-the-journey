export interface FastTextThresholdConfig {
  modelMinConfidence: number;
  modelMarginConfidence: number;
  fallbackMinScore: number;
  fallbackMargin: number;
}

function bounded(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

export function getFastTextThresholdConfig(): FastTextThresholdConfig {
  return {
    modelMinConfidence: bounded('KURUKOO_FASTTEXT_MODEL_MIN_CONFIDENCE', 0.57, 0, 1),
    modelMarginConfidence: bounded('KURUKOO_FASTTEXT_MODEL_MARGIN_CONFIDENCE', 0.08, 0, 1),
    fallbackMinScore: bounded('KURUKOO_FASTTEXT_FALLBACK_MIN_SCORE', 0.42, 0, 1),
    fallbackMargin: bounded('KURUKOO_FASTTEXT_FALLBACK_MARGIN', 0.08, 0, 1),
  };
}
