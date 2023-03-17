// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { WebdriverIoUnsupportedPuppeteerErrorText, WebdriverIoRemotePuppeteerErrorText } from '../exceptions';

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
