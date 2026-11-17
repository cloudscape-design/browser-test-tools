// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getViewportSize } from '../browser-scripts';

export interface BrowserUISize {
  width: number;
  height: number;
}

const STABLE_READS = 3;
const READ_INTERVAL = 100;
const TIMEOUT = 3000;

const browserUISizes = new WeakMap<WebdriverIO.Browser, BrowserUISize>();

export function getBrowserUISize(browser: WebdriverIO.Browser): BrowserUISize | undefined {
  return browserUISizes.get(browser);
}

/**
 * Measures the browser UI size (window size minus viewport size) once the viewport has stopped changing,
 * and stores it for this browser. Firefox can report a smaller viewport for a short time after a resize,
 * so measuring it on every resize can produce a wrong offset.
 */
export async function measureBrowserUISize(browser: WebdriverIO.Browser): Promise<BrowserUISize | undefined> {
  let last = '';
  let stableReads = 0;
  let size: BrowserUISize = { width: 0, height: 0 };
  const timeoutMsg = 'Viewport did not stabilize before measuring the browser UI size';

  try {
    await browser.waitUntil(
      async () => {
        const windowSize = await browser.getWindowSize();
        const viewport = await browser.execute(getViewportSize);
        size = { width: windowSize.width - viewport.width, height: windowSize.height - viewport.height };
        const current = `${windowSize.width}x${windowSize.height}/${viewport.width}x${viewport.height}`;
        stableReads = current === last ? stableReads + 1 : 1;
        last = current;
        return stableReads >= STABLE_READS;
      },
      { timeout: TIMEOUT, interval: READ_INTERVAL, timeoutMsg }
    );
  } catch (error) {
    if (!(error instanceof Error) || error.message !== timeoutMsg) {
      throw error;
    }
    // Don't store a size measured while the viewport was still changing.
    console.warn(timeoutMsg);
    return undefined;
  }

  browserUISizes.set(browser, size);
  return size;
}
