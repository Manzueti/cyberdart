/**
 * Claude backend selection for paid evals and E2E tests.
 *
 * Two backends:
 *   1. Claude API (default) — ANTHROPIC_API_KEY.
 *   2. Claude Models on Google Cloud (Anthropic managed) — opt in with
 *      CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD=1 plus
 *      ANTHROPIC_GOOGLE_CLOUD_PROJECT and ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID.
 *      Auth is Google Application Default Credentials
 *      (`gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS).
 *
 * The same CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD switch is read by `claude -p`
 * and the Agent SDK, so one env setup drives the LLM judge and the E2E sessions.
 */

import Anthropic from '@anthropic-ai/sdk';

/** Env vars that configure the Google Cloud backend (forwarded to spawned claude). */
const GOOGLE_CLOUD_ENV_VARS = [
  'CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD',
  'ANTHROPIC_GOOGLE_CLOUD_PROJECT',
  'ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID',
  'ANTHROPIC_GOOGLE_CLOUD_LOCATION',
  'ANTHROPIC_GOOGLE_CLOUD_BASE_URL',
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'CLOUDSDK_CONFIG',
] as const;

function truthy(v: string | undefined): boolean {
  return !!v && v !== '0' && v.toLowerCase() !== 'false';
}

/** True when the Google Cloud (Anthropic managed) backend is selected. */
export function usesGoogleCloud(): boolean {
  return truthy(process.env.CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD);
}

/** True when some Claude backend is configured for paid tests. */
export function hasClaudeAuth(): boolean {
  return usesGoogleCloud() || !!process.env.ANTHROPIC_API_KEY;
}

/** Human-readable hint for skip messages. */
export const CLAUDE_AUTH_HINT =
  'export ANTHROPIC_API_KEY, or set CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD=1 with ' +
  'ANTHROPIC_GOOGLE_CLOUD_PROJECT + ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID and Google ADC';

/** Minimal client surface the judges use. Both backends satisfy it. */
export interface JudgeClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    }): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
}

/**
 * Build a Messages API client for the selected backend. The Google Cloud SDK
 * is imported lazily so API-key users never load google-auth-library.
 */
export async function createClaudeClient(): Promise<JudgeClient> {
  if (usesGoogleCloud()) {
    const { AnthropicGoogleCloud } = await import('@anthropic-ai/google-cloud-sdk');
    // Project, workspace ID and location come from ANTHROPIC_GOOGLE_CLOUD_* env.
    return new AnthropicGoogleCloud() as unknown as JudgeClient;
  }
  return new Anthropic() as unknown as JudgeClient;
}

/**
 * Env to hand to the Agent SDK's `env` option, which replaces (not merges)
 * the child environment for auth purposes. Returns only the vars for the
 * selected backend so an API key never shadows the Google Cloud settings.
 */
export function claudeAuthEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  if (usesGoogleCloud()) {
    for (const name of GOOGLE_CLOUD_ENV_VARS) {
      const v = process.env[name];
      if (v !== undefined) env[name] = v;
    }
    return env;
  }
  env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
  return env;
}
