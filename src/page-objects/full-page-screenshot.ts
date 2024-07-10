// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Browser as PuppeteerBrowser } from 'puppeteer-core';
import { getViewportSize, windowScrollTo } from '../browser-scripts';
import mergeImages from '../image-utils/merge';
import { waitForTimerAndAnimationFrame } from './browser-scripts';
import { calculateIosTopOffset, getPuppeteer } from './utils';

const MAX_SCREENSHOT_HEIGHT = 16000;

async function scroll(browser: WebdriverIO.Browser, topOffset: number) {
  await browser.execute(windowScrollTo, topOffset, 0);
}

async function checkDocumentSize(browser: WebdriverIO.Browser) {
  const viewPortSize = await browser.execute(getViewportSize);

  if (viewPortSize.pageHeight > MAX_SCREENSHOT_HEIGHT) {
    console.warn(
      `The permutation page is higher than ${MAX_SCREENSHOT_HEIGHT}. Taking a screenshot might cause problems.`
    );
  }
  return viewPortSize;
}

export async function scrollAndMergeStrategy(browser: WebdriverIO.Browser) {
  const { width, height, pageHeight, screenWidth, screenHeight, pixelRatio } = await checkDocumentSize(browser);
  let offset = 0;
  const screenshots: string[] = [];
  while (offset < pageHeight) {
    await scroll(browser, offset);

    // Wait for scroll effects to settle.
    await browser.executeAsync(waitForTimerAndAnimationFrame, 200);

    const value = await browser.takeScreenshot();
    screenshots.push(value);
    offset += height;
  }
  // skip images merge when there is only one screenshot
  if (screenshots.length === 1 && !browser.isIOS) {
    return screenshots[0];
  }
  const lastImageOffset = offset - pageHeight;

  let offsetTop = 0;
  if (browser.isIOS) {
    offsetTop = calculateIosTopOffset({ screenWidth, screenHeight, pixelRatio });
  }

  return mergeImages(screenshots, width * pixelRatio, height * pixelRatio, lastImageOffset * pixelRatio, offsetTop);
}

export default async function fullPageScreenshot(browser: WebdriverIO.Browser, forceScrollAndMerge: boolean = false) {
  const puppeteer = await getPuppeteer(browser);
  if (puppeteer && !forceScrollAndMerge) {
    // casting due to mismatch in NodeJS types of EventEmitter
    return puppeteerStrategy(browser, puppeteer as unknown as PuppeteerBrowser);
  }
  console.warn('Falling back to scroll-and-merge strategy');
  return scrollAndMergeStrategy(browser);
}

export async function puppeteerStrategy(browser: WebdriverIO.Browser, puppeteer: PuppeteerBrowser): Promise<string> {
  const image = await browser.call(async () => {
    // Assuming only one page open
    const [current] = await puppeteer.pages();
    return current.screenshot({
      fullPage: true,
      encoding: 'base64',
    });
  });
  // encoding=base64 returns a string
  // See: https://pptr.dev/#?product=Puppeteer&version=v13.2.0&show=api-pagescreenshotoptions
  return image as string;
}
