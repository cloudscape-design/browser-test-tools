// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import BrowserCreator from './browser-creator';
import defaultCapabilities, { Capabilities, getCapability, mergeCapabilities } from './capabilities';

const localBrowsers: Record<string, Capabilities> = {
  ChromeHeadless: mergeCapabilities(defaultCapabilities.ChromeHeadless, {
    'goog:chromeOptions': {
      // do not use retina screen when testing locally
      mobileEmulation: {
        deviceMetrics: {
          pixelRatio: 1,
        },
      },
    },
  }),
  ChromeHeadlessIntegration: mergeCapabilities(defaultCapabilities.ChromeHeadless, {
    'goog:chromeOptions': {
      args: ['--force-prefers-reduced-motion'],
    },
  }),
  Firefox: mergeCapabilities(defaultCapabilities.Firefox, {
    // https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html
    'moz:debuggerAddress': true,
  }),
};

export default class LocalBrowserCreator extends BrowserCreator {
  async __getBrowserUrl() {
    return new URL(this.options.seleniumUrl);
  }

  __getCapabilities(): Capabilities {
    return getCapability(this.browserName, localBrowsers);
  }
}
