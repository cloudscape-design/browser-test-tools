// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { parsePng, packPng } = require('../src/image-utils/utils');
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

for (let i = 0; i < 10; i++) {
  test.only(
    `${i}: scrollAndMergeStrategy and puppeteerStrategy produce same for multiple pages`,
    setupTest(async browser => {
      const puppeteer = await browser.getPuppeteer();

      const toggle = await browser.$('#multiple-pages-toggle');
      await toggle.click();

      console.log('puppeteer');
      const puppeteerImage = await puppeteerStrategy(browser, puppeteer);
      console.log('scrollAndMerge');
      const scrollAndMergeImage = await scrollAndMergeStrategy(browser);
      console.log('parsing');
      const expected = await parsePng(puppeteerImage);
      const actual = await parsePng(scrollAndMergeImage);
      console.log('compare');
      const diff = compareImages(expected, actual, { width: expected.width, height: expected.height });

      // Dump screenshtos to console for manual review and investigate why the test is flaky
      // console.log('puppeteer image');
      // console.log(puppeteerImage);
      // console.log('scroll-and-merge image');
      // console.log(scrollAndMergeImage);

      // fs.writeFileSync('puppeteer.png', (await packPng(expected)).toString());
      // fs.writeFileSync('scrollAndMerge.png', (await packPng(actual)).toString());

      console.log('check.');
      if (diff.diffImage) {
        console.log('diff image');
        // console.log((await packPng(diff.diffImage)).toString('base64'));
      } else {
        console.log('no diff image');
      }

      expect(diff.diffPixels).toEqual(0);
    })
  );
}
