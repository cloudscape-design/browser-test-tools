// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { parsePng } = require('../src/image-utils/pngs');
const { compareImages } = require('../src/image-utils/compare');
const useBrowser = require('../src/use-browser').default;
const { scrollAndMergeStrategy, puppeteerStrategy } = require('../src/page-objects/full-page-screenshot');

function setupTest(testFn) {
  return useBrowser(async browser => {
    await browser.url('/test-full-page-screenshot.html');
    await testFn(browser);
  });
}

test(
  'scrollAndMergeStrategy and puppeteerStrategy produce same for single page',
  setupTest(async browser => {
    const puppeteer = await browser.getPuppeteer();

    const expected = await parsePng(await puppeteerStrategy(browser, puppeteer));
    const actual = await parsePng(await scrollAndMergeStrategy(browser));
    const diff = compareImages(expected, actual, { width: expected.width, height: expected.height });

    expect(diff.diffPixels).toEqual(0);
  })
);

test(
  'scrollAndMergeStrategy and puppeteerStrategy produce same for multiple pages',
  setupTest(async browser => {
    const puppeteer = await browser.getPuppeteer();

    const toggle = await browser.$('#multiple-pages-toggle');
    await toggle.click();

    const expected = await parsePng(await puppeteerStrategy(browser, puppeteer));
    const actual = await parsePng(await scrollAndMergeStrategy(browser));
    const diff = compareImages(expected, actual, { width: expected.width, height: expected.height });

    expect(diff.diffPixels).toEqual(0);
  })
);
