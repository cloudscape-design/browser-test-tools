// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe, vi } from 'vitest';
import { getBrowserUISize, measureBrowserUISize } from '../src/browsers/browser-ui-size';

type Viewport = { width: number; height: number };

function createFakeBrowser(viewports: Viewport[], maxPolls = 10) {
  let index = 0;
  return {
    getWindowSize: vi.fn(async () => ({ width: 1200, height: 800 })),
    execute: vi.fn(async () => viewports[Math.min(index++, viewports.length - 1)]),
    waitUntil: vi.fn(async (condition: () => Promise<boolean>, { timeoutMsg }: { timeoutMsg: string }) => {
      for (let poll = 0; poll < maxPolls; poll++) {
        if (await condition()) {
          return true;
        }
      }
      throw new Error(timeoutMsg);
    }),
  } as unknown as WebdriverIO.Browser;
}

describe('measureBrowserUISize', () => {
  test('stores the browser UI size once the viewport is stable', async () => {
    const browser = createFakeBrowser([
      { width: 1200, height: 600 },
      { width: 1200, height: 700 },
      { width: 1200, height: 700 },
      { width: 1200, height: 700 },
    ]);
    await expect(measureBrowserUISize(browser)).resolves.toEqual({ width: 0, height: 100 });
    expect(getBrowserUISize(browser)).toEqual({ width: 0, height: 100 });
  });

  test('stores nothing when the viewport keeps changing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const changing = Array.from({ length: 20 }, (_, i) => ({ width: 1200, height: 600 + i }));
    const browser = createFakeBrowser(changing);
    await expect(measureBrowserUISize(browser)).resolves.toBeUndefined();
    expect(getBrowserUISize(browser)).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Viewport did not stabilize before measuring the browser UI size');
    warn.mockRestore();
  });

  test('rethrows other errors', async () => {
    const browser = createFakeBrowser([{ width: 1200, height: 700 }]);
    vi.mocked(browser.waitUntil).mockRejectedValueOnce(new Error('invalid session id'));
    await expect(measureBrowserUISize(browser)).rejects.toThrow('invalid session id');
  });

  test('rethrows values that are not errors', async () => {
    const browser = createFakeBrowser([{ width: 1200, height: 700 }]);
    vi.mocked(browser.waitUntil).mockRejectedValueOnce('boom');
    await expect(measureBrowserUISize(browser)).rejects.toBe('boom');
  });
});
