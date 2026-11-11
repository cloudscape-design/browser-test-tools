// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, test, vi } from 'vitest';
import type { Browser } from 'webdriverio';
import { setWindowSizeAndSettle } from '../src/browsers/window-size';

// A fake browser whose viewport reads come from a list, repeating the last value.
function fakeBrowser(viewports: string[], windowSize = { width: 1200, height: 800 }) {
  let reads = 0;
  const browser = {
    setWindowSize: vi.fn(async () => {}),
    getWindowSize: vi.fn(async () => windowSize),
    execute: vi.fn(async () => viewports[Math.min(reads++, viewports.length - 1)]),
    waitUntil: vi.fn(async (condition: () => Promise<boolean>, { timeout }: { timeout: number }) => {
      // Poll without real delays; give up after `timeout` attempts.
      for (let i = 0; i < timeout; i++) {
        if (await condition()) {
          return true;
        }
      }
      throw new Error('timeout');
    }),
  };
  return browser as typeof browser & Browser;
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('resizes and returns once the viewport is stable', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const browser = fakeBrowser(['1200x714']);

  await setWindowSizeAndSettle(browser, 1200, 800);

  expect(browser.setWindowSize).toHaveBeenCalledWith(1200, 800);
  // first read + two identical reads
  expect(browser.execute).toHaveBeenCalledTimes(3);
  expect(log).not.toHaveBeenCalled();
});

test('waits while the viewport is still changing and logs the change', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const browser = fakeBrowser(['1200x580', '1200x650', '1200x714']);

  await setWindowSizeAndSettle(browser, 1200, 800);

  expect(browser.execute).toHaveBeenCalledTimes(5);
  expect(log).toHaveBeenCalledWith(expect.stringContaining('Viewport settled from 1200x580 to 1200x714'));
});

test('waits until the window reports the requested size', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const browser = fakeBrowser(['1200x714'], { width: 1200, height: 600 });

  await setWindowSizeAndSettle(browser, 1200, 800, { timeout: 5 });

  expect(browser.execute).toHaveBeenCalledTimes(5);
});

test('warns instead of throwing when the viewport does not settle', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  let height = 500;
  const browser = fakeBrowser([]);
  browser.execute.mockImplementation(async () => `1200x${height++}`);

  await expect(setWindowSizeAndSettle(browser, 1200, 800, { timeout: 5 })).resolves.toBeUndefined();

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Viewport did not settle within 5ms'));
});
