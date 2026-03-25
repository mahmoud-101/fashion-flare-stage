export const MODEL_CONFIG = {
  hashtags: { model: 'gemini-2.0-flash', maxTokens: 500 },
  copywriting: { model: 'claude-3-5-haiku', maxTokens: 1000 },
  imageAnalysis: { model: 'gpt-4o-mini', maxTokens: 800 },
  longFormContent: { model: 'claude-3-7-sonnet', maxTokens: 4000 },
  competitorSpy: { model: 'gemini-2.0-flash', maxTokens: 2000 },
  adCreative: { model: 'claude-3-5-haiku', maxTokens: 1200 },
  abTesting: { model: 'claude-3-5-haiku', maxTokens: 800 },
} as const;

export type ModelFeature = keyof typeof MODEL_CONFIG;

export function getModelHeaders(feature: ModelFeature): Record<string, string> {
  const config = MODEL_CONFIG[feature];
  return {
    'x-moda-model': config.model,
    'x-moda-max-tokens': String(config.maxTokens),
  };
}
