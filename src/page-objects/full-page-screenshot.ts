// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Browser as PuppeteerBrowser } from 'puppeteer-core';
import { getViewportSize, windowScrollTo } from '../browser-scripts';
import { cropImage } from '../image-utils/crop';
import { getMaskForIos, getMaskForScrollOffset } from '../image-utils/mask';
import merge from '../image-utils/merge';
import { parsePng, packPng } from '../image-utils/pngs';
import { waitForTimerAndAnimationFrame } from './browser-scripts';
import { getPuppeteer } from './utils';

const MAX_SCREENSHOT_HEIGHT = 20000;

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
  const { height: initialViewportHeight, pageHeight, pixelRatio } = await checkDocumentSize(browser);
  const screenshots = await takeScreenshots(browser, initialViewportHeight, pageHeight);

  let pngs = await Promise.all(screenshots.map(screenshot => parsePng(screenshot)));
  if (browser.isIOS) {
    pngs = pngs.map(png => cropImage(png, getMaskForIos(png.width, png.height)));
  }

  if (pngs.length > 1) {
    const last = pngs[pngs.length - 1];
    const scrollOffsetMask = getMaskForScrollOffset(
      last.width,
      last.height,
      initialViewportHeight * pixelRatio,
      pageHeight * pixelRatio
    );
    pngs[pngs.length - 1] = cropImage(last, scrollOffsetMask);
  }

  const packed = await packPng(merge(pngs));
  return packed.toString('base64');
}

async function takeScreenshots(browser: WebdriverIO.Browser, viewportHeight: number, pageHeight: number) {
  let offset = 0;
  const screenshots: string[] = [];
  while (offset < pageHeight) {
    await scroll(browser, offset);

    // Wait for scroll effects to settle.
    await browser.executeAsync(waitForTimerAndAnimationFrame, 200);

    const screenshot = await browser.takeScreenshot();
    screenshots.push(screenshot);
    offset += viewportHeight;
  }
  return screenshots;
}

export default async function fullPageScreenshot(browser: WebdriverIO.Browser) {
  const puppeteer = await getPuppeteer(browser);
  if (puppeteer) {
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
