// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Browser } from 'webdriverio';

export interface SettleOptions {
  timeout?: number;
  interval?: number;
}

/**
 * Resizes the window and waits until the page viewport stops changing.
 *
 * Firefox can return from Set Window Rect before the content viewport has its final size,
 * so a page opened right after may measure a smaller viewport. This waits until the window
 * has the requested size and the viewport is the same across consecutive reads.
 */
export async function setWindowSizeAndSettle(
  browser: Browser,
  width: number,
  height: number,
  { timeout = 3000, interval = 50 }: SettleOptions = {}
): Promise<void> {
  await browser.setWindowSize(width, height);

  const start = Date.now();
  let first: string | undefined;
  let previous: string | undefined;
  let stableReads = 0;

  try {
    await browser.waitUntil(
      async () => {
        const rect = await browser.getWindowSize();
        const viewport = await browser.execute(() => `${window.innerWidth}x${window.innerHeight}`);
        first ??= viewport;
        stableReads = viewport === previous ? stableReads + 1 : 0;
        previous = viewport;
        return rect.width === width && rect.height === height && stableReads >= 2;
      },
      { timeout, interval }
    );
  } catch {
    console.warn(
      `Viewport did not settle within ${timeout}ms after resizing to ${width}x${height} (last: ${previous})`
    );
  }

  if (first !== previous) {
    console.log(`Viewport settled from ${first} to ${previous} in ${Date.now() - start}ms`);
  }
}
