// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import fs from 'fs';
import { PNG } from 'pngjs';
import useBrowser from '../src/use-browser';
import { ScreenshotPageObject, ScreenshotWithOffset } from '../src/page-objects';
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

async function cropAndCompareTest(s1: ScreenshotWithOffset, s2: ScreenshotWithOffset) {
  const { firstImage, secondImage, diffImage, isEqual, diffPixels } = await cropAndCompare(s1, s2);
  return {
    firstImage: firstImage instanceof Buffer,
    secondImage: secondImage instanceof Buffer,
    diffImage: diffImage instanceof Buffer,
    isEqual,
    diffPixels,
  };
}

test(
  'should detect an empty screenshot',
  setupTest(async page => {
    const result = await page.captureBySelector('#empty-box');
    await expect(cropAndCompareTest(result, result)).rejects.toThrow(/Image does not contain enough colors/);
  })
);

test(
  'should compare two provided images directly',
  setupTest(async (page, browser) => {
    const firstResult = await page.captureBySelector('#box1');
    await browser.refresh();
    const secondResult = await page.captureBySelector('#box1');
    await expect(cropAndCompareTest(firstResult, secondResult)).resolves.toEqual({
      firstImage: true,
      secondImage: true,
      diffImage: false,
      diffPixels: 0,
      isEqual: true,
    });
  })
);

test(
  'should compare viewport screenshots',
  setupTest(async (page, browser) => {
    await page.waitForJsTimers(1000);
    const firstResult = await page.captureViewport();
    await browser.refresh();
    await page.waitForJsTimers(1000);
    const secondResult = await page.captureViewport();
    await expect(cropAndCompareTest(firstResult, secondResult)).resolves.toEqual({
      firstImage: true,
      secondImage: true,
      diffImage: false,
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
    await expect(cropAndCompareTest(firstResult, secondResult)).resolves.toEqual({
      firstImage: true,
      secondImage: true,
      diffImage: true,
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
    await expect(cropAndCompareTest(firstResult, secondResult)).resolves.toEqual({
      firstImage: true,
      secondImage: true,
      diffImage: true,
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
    await expect(cropAndCompareTest(firstResult, secondResult)).resolves.toEqual({
      firstImage: true,
      secondImage: true,
      diffImage: true,
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
    await expect(cropAndCompareTest(firstResult, secondResult)).resolves.toEqual({
      firstImage: true,
      secondImage: true,
      diffImage: false,
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
  const { diffPixels } = await cropAndCompareTest(
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
  const { diffPixels } = await cropAndCompareTest(
    { image: img, pixelRatio: 2, offset, width: img.width, height: img.height },
    { image: img, pixelRatio: 2, offset, width: img.width, height: img.height }
  );

  expect(diffPixels).toBe(0);
});

test('returns isEqual=false when comparing images with 0-size', async () => {
  const image = await parsePng(fs.readFileSync(__dirname + '/fixtures/blue@2x.png', 'base64'));
  const props = { image, pixelRatio: 2, offset: { top: 10, left: 10 }, width: 100, height: 100 };

  // Normalized width and height is 100.
  expect(await cropAndCompareTest({ ...props, width: 0 }, { ...props })).toEqual(
    expect.objectContaining({ isEqual: true, diffPixels: 0 })
  );
  expect(await cropAndCompareTest({ ...props }, { ...props, height: 0 })).toEqual(
    expect.objectContaining({ isEqual: true, diffPixels: 0 })
  );

  // Normalized width is 0.
  expect(await cropAndCompareTest({ ...props, width: 0 }, { ...props, width: 0 })).toEqual(
    expect.objectContaining({
      isEqual: false,
      diffPixels: -1,
    })
  );

  // Normalized height is 0.
  expect(await cropAndCompareTest({ ...props, height: 0 }, { ...props, height: 0 })).toEqual(
    expect.objectContaining({
      isEqual: false,
      diffPixels: -1,
    })
  );

  // Normalized width and height is 0.
  expect(await cropAndCompareTest({ ...props, width: 0, height: 0 }, { ...props, width: 0, height: 0 })).toEqual(
    expect.objectContaining({
      isEqual: false,
      diffPixels: -1,
    })
  );
});
