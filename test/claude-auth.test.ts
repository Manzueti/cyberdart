import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { usesGoogleCloud, hasClaudeAuth, claudeAuthEnv, createClaudeClient } from './helpers/claude-auth';

const VARS = [
  'ANTHROPIC_API_KEY',
  'CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD',
  'ANTHROPIC_GOOGLE_CLOUD_PROJECT',
  'ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
];

describe('claude-auth backend selection', () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(VARS.map(v => [v, process.env[v]]));
    for (const v of VARS) delete process.env[v];
  });
  afterEach(() => {
    for (const v of VARS) {
      if (saved[v] === undefined) delete process.env[v];
      else process.env[v] = saved[v];
    }
  });

  test('no backend configured', () => {
    expect(usesGoogleCloud()).toBe(false);
    expect(hasClaudeAuth()).toBe(false);
  });

  test('API key backend', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    expect(hasClaudeAuth()).toBe(true);
    expect(claudeAuthEnv()).toEqual({ ANTHROPIC_API_KEY: 'sk-test' });
  });

  test('switch values 0/false do not enable Google Cloud', () => {
    process.env.CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD = '0';
    expect(usesGoogleCloud()).toBe(false);
    process.env.CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD = 'false';
    expect(usesGoogleCloud()).toBe(false);
  });

  test('Google Cloud backend forwards its vars and never the API key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    process.env.CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD = '1';
    process.env.ANTHROPIC_GOOGLE_CLOUD_PROJECT = 'proj';
    process.env.ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID = 'wrkspc_x';
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/sa.json';
    expect(hasClaudeAuth()).toBe(true);
    expect(claudeAuthEnv()).toEqual({
      CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD: '1',
      ANTHROPIC_GOOGLE_CLOUD_PROJECT: 'proj',
      ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID: 'wrkspc_x',
      GOOGLE_APPLICATION_CREDENTIALS: '/tmp/sa.json',
    });
  });

  test('createClaudeClient picks the Google Cloud client', async () => {
    process.env.CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD = '1';
    process.env.ANTHROPIC_GOOGLE_CLOUD_PROJECT = 'proj';
    process.env.ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID = 'wrkspc_x';
    const client = await createClaudeClient();
    expect(client.constructor.name).toBe('AnthropicGoogleCloud');
  });

  test('createClaudeClient defaults to the Claude API client', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    const client = await createClaudeClient();
    expect(client.constructor.name).toBe('Anthropic');
  });
});
