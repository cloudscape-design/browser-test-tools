// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { WebdriverIoUnsupportedPuppeteerErrorText, WebdriverIoRemotePuppeteerErrorText } from '../exceptions';
import { ViewportSize, ElementRect } from './types';

export function getElementCenter(rect: ElementRect): { x: number; y: number } {
  return {
    x: Math.floor(rect.left + rect.width / 2),
    y: Math.floor(rect.top + rect.height / 2),
  };
}

// This is the pixel value *before* applying the device pixel ratio
const iosAddressBarHeight = 50;

// Device specific sizes for iOS devices. Models before iPhone X are covered by the default value.
// Viewport values taken from https://yesviz.com/iphones.php
const iosDeviceConfig = [
  {
    name: 'iPhone 12 (Pro)',
    width: 390,
    height: 844,
    statusBarHeight: 141,
  },
  {
    name: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    statusBarHeight: 141,
  },
  {
    name: 'iPhone 11 Pro',
    width: 375,
    height: 812,
    statusBarHeight: 132,
  },
  {
    name: 'iPhone 11 Pro Max',
    width: 414,
    height: 896,
    statusBarHeight: 132,
  },
];

// Screenshots on iOS include all iOS UI elements like toolbars and navigation, so we need to
// cut them out of screenshots. This function provides relevant offsets.
export function calculateIosTopOffset(
  dimensions: Pick<ViewportSize, 'screenWidth' | 'screenHeight' | 'pixelRatio'>
): number {
  const { screenWidth: width, screenHeight: height } = dimensions;

  // Default height for most models before the iPhone X
  let statusBarHeight = 20 * dimensions.pixelRatio;

  const deviceConfig = iosDeviceConfig.find(
    config =>
      (width === config.width && height === config.height) || (width === config.height && height === config.width)
  );
  if (deviceConfig) {
    statusBarHeight = deviceConfig.statusBarHeight;
  }

  const addressBarHeight = iosAddressBarHeight * dimensions.pixelRatio;

  return statusBarHeight + addressBarHeight;
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
