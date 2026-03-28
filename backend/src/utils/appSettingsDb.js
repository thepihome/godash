import { queryOne, execute } from './db.js';

const AI_CONFIG_KEY = 'ai_matching_config';

export async function getAppSetting(env, key) {
  const row = await queryOne(env, 'SELECT value FROM app_settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setAppSetting(env, key, value) {
  await execute(
    env,
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
    [key, value]
  );
}

const DEFAULT_AI_CONFIG = {
  provider: 'openai',
  openai_api_key: '',
  openai_model: 'gpt-4o-mini',
  anthropic_api_key: '',
  anthropic_model: 'claude-3-5-sonnet-20241022',
  gemini_api_key: '',
  gemini_model: 'gemini-1.5-flash',
  min_match_score: 35,
};

export async function getAiMatchingConfig(env) {
  const raw = await getAppSetting(env, AI_CONFIG_KEY);
  if (!raw) return { ...DEFAULT_AI_CONFIG };
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export async function saveAiMatchingConfig(env, partial) {
  const current = await getAiMatchingConfig(env);
  const next = { ...current, ...partial };
  await setAppSetting(env, AI_CONFIG_KEY, JSON.stringify(next));
  return next;
}

export function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  if (key.length <= 8) return '********';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function toPublicAiConfig(config) {
  return {
    provider: config.provider,
    openai_model: config.openai_model,
    openai_key_set: !!(config.openai_api_key && config.openai_api_key.length > 0),
    openai_key_preview: maskApiKey(config.openai_api_key),
    anthropic_model: config.anthropic_model,
    anthropic_key_set: !!(config.anthropic_api_key && config.anthropic_api_key.length > 0),
    anthropic_key_preview: maskApiKey(config.anthropic_api_key),
    gemini_model: config.gemini_model,
    gemini_key_set: !!(config.gemini_api_key && config.gemini_api_key.length > 0),
    gemini_key_preview: maskApiKey(config.gemini_api_key),
    min_match_score: config.min_match_score ?? 35,
  };
}
