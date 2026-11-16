import { describe, it, expect } from 'bun:test';

// ─── BrowserManager basic unit tests ─────────────────────────────

describe('BrowserManager defaults', () => {
  it('getConnectionMode defaults to launched', async () => {
    const { BrowserManager } = await import('../src/browser-manager');
    const bm = new BrowserManager();
    expect(bm.getConnectionMode()).toBe('launched');
  });

  it('getRefMap returns empty array initially', async () => {
    const { BrowserManager } = await import('../src/browser-manager');
    const bm = new BrowserManager();
    expect(bm.getRefMap()).toEqual([]);
  });
});

describe('BrowserManager headless launch', () => {
  it('honors CYBERDART_CHROMIUM_PATH', async () => {
    const { BrowserManager } = await import('../src/browser-manager');
    const bogus = '/nonexistent/cyberdart-test-chromium';
    const prev = process.env.CYBERDART_CHROMIUM_PATH;
    process.env.CYBERDART_CHROMIUM_PATH = bogus;
    try {
      const bm = new BrowserManager();
      // Playwright names the executable it tried; seeing our path proves the
      // override reached chromium.launch() in headless mode.
      await expect(bm.launch()).rejects.toThrow(bogus);
    } finally {
      if (prev === undefined) delete process.env.CYBERDART_CHROMIUM_PATH;
      else process.env.CYBERDART_CHROMIUM_PATH = prev;
    }
  });
});
