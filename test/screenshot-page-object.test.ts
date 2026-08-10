// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe } from 'vitest';
import { ScreenshotPageObject } from '../src/page-objects';
import useBrowser from '../src/use-browser';
import './utils/setup-local-driver';

type TestFn = (page: ScreenshotPageObject) => Promise<void>;
function setupTest(testFn: TestFn, url = './test-page-object.html') {
  return useBrowser(async browser => {
    await browser.url(url);
    await testFn(new ScreenshotPageObject(browser));
  });
}

test(
  'focusNextElement',
  setupTest(async page => {
    await page.click('#input-1');
    await page.focusNextElement();
    expect(await page.isFocused('#input-2')).toBe(true);
  })
);

test(
  'scrollToRight',
  setupTest(async page => {
    const width = 400;
    const overscroll = (width * 20) / 100; // The container has 120% width
    await page.setWindowSize({ width, height: 300 });
    await page.scrollToRight('#scrollable-container');
    expect(await page.getElementScroll('#scrollable-container')).toEqual({ top: 0, left: overscroll });
  })
);

test(
  'scrollToBottom',
  setupTest(async page => {
    const testElement = '#scrollable-container';
    const { height } = await page.getBoundingBox(testElement);
    const scrollHeight = (await page.getElementProperty(testElement, 'scrollHeight')) as number;

    await page.scrollToBottom(testElement);

    const { top } = await page.getElementScroll(testElement);
    expect(top).toBeGreaterThanOrEqual(scrollHeight - height);
  })
);

describe('capturePermutations', () => {
  test(
    'captures all permutations with correct ids and dimensions',
    setupTest(async page => {
      const permutations = await page.capturePermutations();

      expect(permutations).toHaveLength(3);
      expect(permutations.map(p => p.id)).toEqual(['perm-1', 'perm-2', 'perm-3']);

      permutations.forEach(perm => {
        expect(perm.image).toBeDefined();
        expect(perm.width).toBeGreaterThan(0);
        expect(perm.height).toBeGreaterThan(0);
        expect(perm.offset.top).toBeGreaterThanOrEqual(0);
        expect(perm.offset.left).toBeGreaterThanOrEqual(0);
      });

      // Verify permutations are in order (top to bottom)
      expect(permutations[0].offset.top).toBeLessThan(permutations[1].offset.top);
      expect(permutations[1].offset.top).toBeLessThan(permutations[2].offset.top);
    }, './test-permutations.html')
  );

  test(
    'throws error when no permutations found',
    setupTest(async page => {
      await expect(page.capturePermutations()).rejects.toThrowError('No permutations found on current page.');
    })
  );
});
