// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { WebdriverIoUnsupportedPuppeteerErrorText, WebdriverIoRemotePuppeteerErrorText } from '../exceptions';
import { ElementRect } from './types';

export function getElementCenter(rect: ElementRect): { x: number; y: number } {
  return {
    x: Math.floor(rect.left + rect.width / 2),
    y: Math.floor(rect.top + rect.height / 2),
  };
}

export async function getPuppeteer(browser: WebdriverIO.Browser) {
  try {
    const puppeteer = await browser.getPuppeteer();
    return puppeteer;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes(WebdriverIoUnsupportedPuppeteerErrorText) ||
        error.message.includes(WebdriverIoRemotePuppeteerErrorText))
    ) {
      return null;
    }
    throw error;
  }
}
