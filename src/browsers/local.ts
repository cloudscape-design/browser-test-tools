// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import BrowserCreator from './browser-creator';
import defaultCapabilities, { getCapability } from './capabilities';
import type { Capabilities } from '@wdio/types';

const localBrowsers: Record<string, Capabilities.DesiredCapabilities> = {
  ...defaultCapabilities,
  Chrome: {
    ...defaultCapabilities.Chrome,
  },
  ChromeHeadless: {
    ...defaultCapabilities.ChromeHeadless,
    'goog:chromeOptions': {
      ...defaultCapabilities.ChromeHeadless['goog:chromeOptions'],
      // do not use retina screen when testing locally
      mobileEmulation: {
        deviceMetrics: {
          pixelRatio: 1,
        },
      },
    },
  },
  ChromeHeadlessIntegration: {
    ...defaultCapabilities.ChromeHeadless,
    'goog:chromeOptions': {
      ...defaultCapabilities.ChromeHeadless['goog:chromeOptions'],
      args: [
        '--force-prefers-reduced-motion',
        ...(defaultCapabilities.ChromeHeadless['goog:chromeOptions']?.args ?? []),
      ],
    },
  },
  Firefox: {
    ...defaultCapabilities.Firefox,
    // https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html
    'moz:debuggerAddress': true,
  },
};

export default class LocalBrowserCreator extends BrowserCreator {
  async __getBrowserUrl() {
    return new URL(this.options.seleniumUrl);
  }

  __getCapabilities() {
    return getCapability(this.browserName, localBrowsers);
  }
}
