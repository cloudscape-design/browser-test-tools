// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe } from 'vitest';
import { RawScreenshotPageObject } from '../src/page-objects';
import useBrowser from '../src/use-browser';
import './utils/setup-local-driver';

type TestFn = (page: RawScreenshotPageObject) => Promise<void>;
function setupTest(testFn: TestFn, url = './test-page-object.html') {
  return useBrowser(async browser => {
    await browser.url(url);
    await testFn(new RawScreenshotPageObject(browser));
  });
}

describe('RawScreenshotPageObject', () => {
  test(
    'captureBySelector returns rawBase64 without image or offset',
    setupTest(async page => {
      const result = await page.captureBySelector('#text-content');

      expect(result.rawBase64).toBeDefined();
      expect(result.rawBase64.length).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect('image' in result).toBe(false);
      expect('offset' in result).toBe(false);
    })
  );

  test(
    'captureViewport returns rawBase64 without image or offset',
    setupTest(async page => {
      const result = await page.captureViewport();

      expect(result.rawBase64).toBeDefined();
      expect(result.rawBase64.length).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect('image' in result).toBe(false);
      expect('offset' in result).toBe(false);
    })
  );

  test(
    'capturePermutations returns rawBase64 without image or offset',
    setupTest(async page => {
      const permutations = await page.capturePermutations();

      expect(permutations).toHaveLength(3);
      expect(permutations.map(p => p.id)).toEqual(['perm-1', 'perm-2', 'perm-3']);

      permutations.forEach(perm => {
        expect(perm.rawBase64).toBeDefined();
        expect(perm.rawBase64.length).toBeGreaterThan(0);
        expect(perm.width).toBeGreaterThan(0);
        expect(perm.height).toBeGreaterThan(0);
        expect('image' in perm).toBe(false);
        expect('offset' in perm).toBe(false);
      });
    }, './test-permutations.html')
  );

  test(
    'capturePermutations throws when no permutations found',
    setupTest(async page => {
      await expect(page.capturePermutations()).rejects.toThrowError('No permutations found on current page.');
    })
  );
});
