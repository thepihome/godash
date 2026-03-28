/**
 * Admin-only AI matching configuration (stored in app_settings).
 */

import { addCorsHeaders } from '../utils/cors.js';
import { authorize } from '../middleware/auth.js';
import {
  getAiMatchingConfig,
  saveAiMatchingConfig,
  toPublicAiConfig,
} from '../utils/appSettingsDb.js';

export async function handleAiSettings(request, env, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const authError = authorize('admin')(user);
  if (authError) {
    return addCorsHeaders(
      new Response(JSON.stringify({ error: authError.error }), {
        status: authError.status || 403,
        headers: { 'Content-Type': 'application/json' },
      }),
      env,
      request
    );
  }

  if (path === '/api/settings/ai-matching' && method === 'GET') {
    const config = await getAiMatchingConfig(env);
    return addCorsHeaders(
      new Response(JSON.stringify(toPublicAiConfig(config)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      env,
      request
    );
  }

  if (path === '/api/settings/ai-matching' && method === 'PUT') {
    try {
      const body = await request.json();
      const current = await getAiMatchingConfig(env);
      const next = { ...current };

      if (typeof body.provider === 'string' && ['openai', 'anthropic', 'gemini'].includes(body.provider)) {
        next.provider = body.provider;
      }
      if (typeof body.openai_model === 'string') next.openai_model = body.openai_model.trim();
      if (typeof body.anthropic_model === 'string') next.anthropic_model = body.anthropic_model.trim();
      if (typeof body.gemini_model === 'string') next.gemini_model = body.gemini_model.trim();
      if (body.min_match_score !== undefined && body.min_match_score !== null) {
        const m = parseInt(String(body.min_match_score), 10);
        if (!Number.isNaN(m)) next.min_match_score = Math.max(0, Math.min(100, m));
      }

      if (typeof body.openai_api_key === 'string' && body.openai_api_key.trim() !== '') {
        next.openai_api_key = body.openai_api_key.trim();
      }
      if (typeof body.anthropic_api_key === 'string' && body.anthropic_api_key.trim() !== '') {
        next.anthropic_api_key = body.anthropic_api_key.trim();
      }
      if (typeof body.gemini_api_key === 'string' && body.gemini_api_key.trim() !== '') {
        next.gemini_api_key = body.gemini_api_key.trim();
      }

      await saveAiMatchingConfig(env, next);
      const saved = await getAiMatchingConfig(env);
      return addCorsHeaders(
        new Response(JSON.stringify(toPublicAiConfig(saved)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
        env,
        request
      );
    } catch (e) {
      console.error('PUT ai-matching settings:', e);
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Server error', details: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
        env,
        request
      );
    }
  }

  return addCorsHeaders(
    new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }),
    env,
    request
  );
}
