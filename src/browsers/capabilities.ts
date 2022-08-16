// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FatalError } from '../exceptions';
import type { Capabilities } from '@wdio/types';

const defaultCapabilities: Record<string, Capabilities.DesiredCapabilities> = {
  Chrome: {
    browserName: 'chrome',
  },
  ChromeHeadless: {
    browserName: 'chrome',
    'goog:chromeOptions': {
      // inspired by https://github.com/alixaxel/chrome-aws-lambda/blob/master/source/index.js#L71-L114
      args: [
        '--disable-background-timer-throttling',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-cloud-import',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-gesture-typing',
        '--disable-hang-monitor',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-offer-upload-credit-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--disable-tab-for-desktop-share',
        '--disable-translate',
        '--disable-voice-input',
        '--disable-wake-on-wifi',
        '--disk-cache-size=33554432',
        '--enable-async-dns',
        '--enable-simple-cache-backend',
        '--enable-tcp-fast-open',
        '--enable-webgl',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--media-cache-size=33554432',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-zygote',
        '--password-store=basic',
        '--prerender-from-omnibox=disabled',
        '--no-sandbox',
        '--disable-gpu',
        '--headless',
      ],
    },
  },
  Firefox: {
    browserName: 'firefox',
    'moz:firefoxOptions': {
      prefs: {
        'fission.webContentIsolationStrategy': 0,
        'fission.bfcacheInParent': false,
      },
    },
  },
  Safari: {
    browserName: 'safari',
    idleTimeout: 180,
  },
  IE11: {
    browserName: 'internet explorer',
  },
};

export function getCapability<T>(browserName: string, capabilities: Record<string, T>): T {
  if (!(browserName in capabilities)) {
    throw new FatalError(`Browser ${browserName} is not supported in this provider`);
  }
  return capabilities[browserName];
}

export default defaultCapabilities;
