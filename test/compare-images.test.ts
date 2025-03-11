// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import fs from 'fs';
import { PNG } from 'pngjs';
import useBrowser from '../src/use-browser';
import { ScreenshotPageObject } from '../src/page-objects';
import { cropAndCompare, parsePng } from '../src/image-utils';
import './utils/setup-local-driver';

type TestFn = (page: ScreenshotPageObject, browser: WebdriverIO.Browser) => Promise<void>;

function setupTest(testFn: TestFn) {
  return useBrowser(async browser => {
    const page = new ScreenshotPageObject(browser);
    await browser.url('./compare-test.html');
    await testFn(page, browser);
  });
}

test(
  'should detect an empty screenshot',
  setupTest(async page => {
    const result = await page.captureBySelector('#empty-box');
    await expect(cropAndCompare(result, result)).rejects.toThrow(/Image does not contain enough colors/);
  })
);

test(
  'should compare two provided images directly',
  setupTest(async (page, browser) => {
    const firstResult = await page.captureBySelector('#box1');
    await browser.refresh();
    const secondResult = await page.captureBySelector('#box1');
    await expect(cropAndCompare(firstResult, secondResult)).resolves.toEqual({
      firstImage: expect.any(Buffer),
      secondImage: expect.any(Buffer),
      diffImage: null,
      diffPixels: 0,
      isEqual: true,
    });
  })
);

test(
  'should compare viewport screenshots',
  setupTest(async (page, browser) => {
    await page.waitForJsTimers(200);
    const firstResult = await page.captureViewport();
    await browser.refresh();
    await page.waitForJsTimers(200);
    const secondResult = await page.captureViewport();
    await expect(cropAndCompare(firstResult, secondResult)).resolves.toEqual({
      firstImage: expect.any(Buffer),
      secondImage: expect.any(Buffer),
      diffImage: null,
      diffPixels: 0,
      isEqual: true,
    });
  })
);

test(
  'should tolerate small color differences',
  setupTest(async (page, browser) => {
    const firstResult = await page.captureBySelector('#box1');
    await browser.refresh();
    const secondResult = await page.captureBySelector('#box2');
    await expect(cropAndCompare(firstResult, secondResult)).resolves.toEqual({
      firstImage: expect.any(Buffer),
      secondImage: expect.any(Buffer),
      diffImage: expect.any(Buffer),
      diffPixels: 0,
      isEqual: true,
    });
  })
);

test(
  'should detect major differences',
  setupTest(async (page, browser) => {
    const firstResult = await page.captureBySelector('#box1');
    await browser.refresh();
    const secondResult = await page.captureBySelector('#box3');
    await expect(cropAndCompare(firstResult, secondResult)).resolves.toEqual({
      firstImage: expect.any(Buffer),
      secondImage: expect.any(Buffer),
      diffImage: expect.any(Buffer),
      diffPixels: expect.any(Number),
      isEqual: false,
    });
  })
);

test(
  'should compare images with different sizes',
  setupTest(async (page, browser) => {
    const firstResult = await page.captureBySelector('#box1');
    await browser.refresh();
    const secondResult = await page.captureBySelector('#icon1');
    await expect(cropAndCompare(firstResult, secondResult)).resolves.toEqual({
      firstImage: expect.any(Buffer),
      secondImage: expect.any(Buffer),
      diffImage: expect.any(Buffer),
      diffPixels: expect.any(Number),
      isEqual: false,
    });
  })
);

test(
  'should capture only visible parts of elements that are positioned off the page',
  setupTest(async page => {
    const firstResult = await page.captureBySelector('#box-offscreen');
    const secondResult = await page.captureBySelector('#box-offscreen');
    await expect(cropAndCompare(firstResult, secondResult)).resolves.toEqual({
      firstImage: expect.any(Buffer),
      secondImage: expect.any(Buffer),
      diffImage: null,
      diffPixels: 0,
      isEqual: true,
    });
  })
);

test(
  'should generate valid diffs for elements with non-integer widths',
  useBrowser(async browser => {
    await browser.url('./rounding-test.html');
    const page = new ScreenshotPageObject(browser);
    const firstResult = await page.captureBySelector('#box1');
    const secondResult = await page.captureBySelector('#box2');
    const result = await cropAndCompare(firstResult, secondResult);
    expect(result.diffPixels).not.toBe(0);

    const { width, height } = new PNG().parse(result.firstImage);
    expect(width).toBe(100); // Defined in CSS as 100.333px
    expect(height).toBe(51); // Defined in CSS as 50.666

    // Write images to do manual assessment
    fs.writeFileSync('build/screenshots/rounding-diff.png', result.diffImage!);
  })
);

// the test above is not enough, because it uses Chrome and cannot reproduce IE use-case
test('should generate valid diffs for fractional offsets', async () => {
  const red = await parsePng(fs.readFileSync(__dirname + '/fixtures/red.png', 'base64'));
  const blue = await parsePng(fs.readFileSync(__dirname + '/fixtures/blue.png', 'base64'));
  const width = 199.99999;
  const height = 99.99999;
  const offset = {
    top: 33.33333,
    left: 33.33333,
  };
  const { diffPixels } = await cropAndCompare(
    { image: red, offset, width, height },
    { image: blue, offset, width, height }
  );

  expect(diffPixels).not.toBe(0);
});

test(
  'should produce correct images',
  setupTest(async (page, browser) => {
    const firstResult = await page.captureBySelector('#icon1');
    await browser.refresh();
    const secondResult = await page.captureBySelector('#icon2');
    const result = await cropAndCompare(firstResult, secondResult);
    // Write images to do manual assessment
    fs.writeFileSync('build/screenshots/first.png', result.firstImage);
    fs.writeFileSync('build/screenshots/second.png', result.secondImage);
    fs.writeFileSync('build/screenshots/diff.png', result.diffImage!);
  })
);

test('should work with higher device pixel ratios', async () => {
  const red = await parsePng(fs.readFileSync(__dirname + '/fixtures/red@2x.png', 'base64'));
  const blue = await parsePng(fs.readFileSync(__dirname + '/fixtures/blue@2x.png', 'base64'));
  const width = 500;
  const height = 150;
  const offset = {
    top: 10,
    left: 10,
  };

  const { diffPixels, diffImage } = await cropAndCompare(
    { image: red, pixelRatio: 2, offset, width, height },
    { image: blue, pixelRatio: 2, offset, width, height }
  );

  fs.writeFileSync('build/screenshots/diff.png', diffImage!);

  expect(diffPixels).not.toBe(0);
});

test('detects identical images with higher device pixel ratios', async () => {
  const img = await parsePng(fs.readFileSync(__dirname + '/fixtures/blue@2x.png', 'base64'));

  const offset = {
    top: 10,
    left: 10,
    width: 500,
    height: 150,
  };
  const { diffPixels } = await cropAndCompare(
    { image: img, pixelRatio: 2, offset, width: img.width, height: img.height },
    { image: img, pixelRatio: 2, offset, width: img.width, height: img.height }
  );

  expect(diffPixels).toBe(0);
});
