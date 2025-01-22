// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import lodash from 'lodash';
import { FatalError } from '../exceptions';

const defaultCapabilities: Record<string, WebdriverIO.Capabilities> = {
  Chrome: {
    browserName: 'chrome',
    browserVersion: 'canary',
  },
  ChromeHeadless: {
    browserName: 'chrome',
    browserVersion: 'canary',
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
        '--headless=new',
      ],
    },
  },
  Firefox: {
    browserName: 'firefox',
    'moz:firefoxOptions': {
      args: ['-headless'],
      prefs: {
        'fission.webContentIsolationStrategy': 0,
        'fission.bfcacheInParent': false,
      },
    },
  },
  Safari: {
    browserName: 'safari',
  },
  IE11: {
    browserName: 'internet explorer',
  },
};

export function getCapability(
  browserName: string,
  capabilities: Record<string, WebdriverIO.Capabilities>
): WebdriverIO.Capabilities {
  if (!(browserName in capabilities)) {
    throw new FatalError(`Browser ${browserName} is not supported in this provider`);
  }
  return capabilities[browserName];
}

function mergeArrays(dest: unknown, src: unknown) {
  if (Array.isArray(dest) && Array.isArray(src)) {
    return dest.concat(src);
  }
}

export function mergeCapabilities<T>(src: T, overrides: Partial<T>): T {
  return lodash.mergeWith({}, src, overrides, mergeArrays);
}

export default defaultCapabilities;
