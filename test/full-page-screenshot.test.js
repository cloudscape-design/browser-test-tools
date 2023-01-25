// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const fs = require('fs/promises');
const { compareImages } = require('../src/image-utils/compare');
const { default: useBrowser } = require('../src/use-browser');
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

    const expected = await puppeteerStrategy(browser, puppeteer).then(img => Buffer.from(img, 'base64'));
    const actual = await scrollAndMergeStrategy(browser).then(img => Buffer.from(img, 'base64'));
    const diff = await compareImages(expected, actual, { width: expected.width, height: expected.height });

    expect(diff.diffPixels).toEqual(0);
  })
);

test.skip(
  'scrollAndMergeStrategy and puppeteerStrategy produce same for multiple pages',
  setupTest(async browser => {
    const puppeteer = await browser.getPuppeteer();

    const toggle = await browser.$('#multiple-pages-toggle');
    await toggle.click();

    const puppeteerImage = await puppeteerStrategy(browser, puppeteer).then(img => Buffer.from(img, 'base64'));
    const scrollAndMergeImage = await scrollAndMergeStrategy(browser).then(img => Buffer.from(img, 'base64'));
    const diff = await compareImages(puppeteerImage, scrollAndMergeImage, {
      width: puppeteerImage.width,
      height: puppeteerImage.height,
    });

    // Dump screenshtos to console for manual review and investigate why the test is flaky
    console.log('puppeteer image');
    console.log(puppeteerImage);
    console.log('scroll-and-merge image');
    console.log(scrollAndMergeImage);
    if (diff.diffImage) {
      console.log('diff image');
      console.log(diff.diffImage.toString('base64'));
    } else {
      console.log('no diff image');
    }

    expect(diff.diffPixels).toEqual(0);
  })
);
