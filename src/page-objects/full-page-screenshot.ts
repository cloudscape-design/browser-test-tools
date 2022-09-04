// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Browser as PuppeteerBrowser } from 'puppeteer-core';
import { getViewportSize, windowScrollTo } from '../browser-scripts';
import merge from '../image-utils/merge';
import type { PNG } from 'pngjs';
import { cropImage, packPng, parsePng } from '../image-utils/utils';
import { waitForTimerAndAnimationFrame } from './browser-scripts';
import { getIosDeviceMask } from './utils';
import { getPuppeteer } from './puppeteer';

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
  const { offset, screenshots } = await takeScreenshots(browser);
  let pngs = await Promise.all(screenshots.map(i => parsePng(i)));
  pngs = await cropImagesByDeviceMask(browser, pngs);
  pngs = await cropImagesByLastOffset(browser, pngs, offset);

  const fullPage = await merge(pngs);
  const packed = await packPng(fullPage);
  return packed.toString('base64');
}

async function takeScreenshots(browser: WebdriverIO.Browser) {
  const { height, pageHeight } = await checkDocumentSize(browser);
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

  return {
    offset: offset - pageHeight,
    screenshots,
  };
}

async function cropImagesByDeviceMask(browser: WebdriverIO.Browser, pngs: PNG[]) {
  // iOS screenshots contain the address and status bar
  if (!browser.isIOS) {
    return pngs;
  }
  const { screenWidth, screenHeight, pixelRatio } = await checkDocumentSize(browser);
  const promises = pngs.map(png => {
    const rect = getIosDeviceMask(
      { width: png.width / pixelRatio, height: png.height / pixelRatio },
      { width: screenWidth, height: screenHeight }
    );
    return cropImage(png, rect, pixelRatio);
  });
  return Promise.all(promises);
}

async function cropImagesByLastOffset(browser: WebdriverIO.Browser, pngs: PNG[], offset: number) {
  if (pngs.length < 2 || offset < 1) {
    return pngs;
  }
  const { pixelRatio } = await checkDocumentSize(browser);
  const last = pngs[pngs.length - 1];
  const rect = {
    top: offset,
    left: 0,
    right: 0,
    bottom: 0,
    width: last.width / pixelRatio,
    height: last.height / pixelRatio - offset,
  };
  return [...pngs.slice(0, -1), cropImage(last, rect, pixelRatio)];
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
