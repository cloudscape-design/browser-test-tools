// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import BrowserCreator from './browser-creator';
import defaultCapabilities, { getCapability, mergeCapabilities } from './capabilities';

const localBrowsers: Record<string, WebdriverIO.Capabilities> = {
  ...defaultCapabilities,
  ChromeHeadless: mergeCapabilities(defaultCapabilities.ChromeHeadless, {
    'goog:chromeOptions': {
      // do not use retina screen when testing locally
      mobileEmulation: {
        deviceMetrics: {
          pixelRatio: 1,
        },
      },
    },
    // Workaround for https://github.com/webdriverio/webdriverio/issues/13440
    // Reference: https://webdriver.io/blog/2024/08/15/webdriverio-v9-release/#new-features
    'wdio:enforceWebDriverClassic': true,
  }),
  ChromeHeadlessIntegration: mergeCapabilities(defaultCapabilities.ChromeHeadless, {
    'goog:chromeOptions': {
      args: ['--force-prefers-reduced-motion'],
    },
    // Workaround for https://github.com/webdriverio/webdriverio/issues/13440
    // Reference: https://webdriver.io/blog/2024/08/15/webdriverio-v9-release/#new-features
    'wdio:enforceWebDriverClassic': true,
  }),
  Firefox: mergeCapabilities(defaultCapabilities.Firefox, {
    'moz:debuggerAddress': true,
    // Workaround for failing internal tests
    // Reference: https://webdriver.io/blog/2024/08/15/webdriverio-v9-release/#new-features
    'wdio:enforceWebDriverClassic': true,
  }),
};

export default class LocalBrowserCreator extends BrowserCreator {
  async __getBrowserUrl() {
    return new URL(this.options.seleniumUrl);
  }

  __getCapabilities(): WebdriverIO.Capabilities {
    return getCapability(this.browserName, localBrowsers);
  }
}
