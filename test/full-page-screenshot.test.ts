// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import type { Browser as PuppeteerBrowser } from 'puppeteer-core';
import { Browser } from 'webdriverio';

import { parsePng, packPng } from '../src/image-utils/utils';
import { compareImages } from '../src/image-utils/compare';
import useBrowser from '../src/use-browser';
import { scrollAndMergeStrategy, puppeteerStrategy } from '../src/page-objects/full-page-screenshot';
import { getPuppeteer } from '../src/page-objects/utils';
import './utils/setup-local-driver';

type TestFn = (browser: Browser) => Promise<void>;
function setupTest(testFn: TestFn) {
  return useBrowser(async browser => {
    await browser.url('/test-full-page-screenshot.html');
    await testFn(browser);
  });
}

test(
  'scrollAndMergeStrategy and puppeteerStrategy produce same for single page',
  setupTest(async browser => {
    const puppeteer = await getPuppeteer(browser);

    const expected = await parsePng(await puppeteerStrategy(browser, puppeteer as unknown as PuppeteerBrowser));
    const actual = await parsePng(await scrollAndMergeStrategy(browser));
    const diff = compareImages(expected, actual, { width: expected.width, height: expected.height });

    expect(diff.diffPixels).toEqual(0);
  })
);

test.skip(
  'scrollAndMergeStrategy and puppeteerStrategy produce same for multiple pages',
  setupTest(async browser => {
    const puppeteer = await getPuppeteer(browser);

    const toggle = await browser.$('#multiple-pages-toggle');
    await toggle.click();

    const puppeteerImage = await puppeteerStrategy(browser, puppeteer as unknown as PuppeteerBrowser);
    const scrollAndMergeImage = await scrollAndMergeStrategy(browser);
    const expected = await parsePng(puppeteerImage);
    const actual = await parsePng(scrollAndMergeImage);
    const diff = compareImages(expected, actual, { width: expected.width, height: expected.height });

    // Dump screenshtos to console for manual review and investigate why the test is flaky
    console.log('puppeteer image');
    console.log(puppeteerImage);
    console.log('scroll-and-merge image');
    console.log(scrollAndMergeImage);
    if (diff.diffImage) {
      console.log('diff image');
      console.log((await packPng(diff.diffImage)).toString('base64'));
    } else {
      console.log('no diff image');
    }

    expect(diff.diffPixels).toEqual(0);
  })
);
