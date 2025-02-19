// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import pRetry, { AbortError } from 'p-retry';
import BrowserCreator, { WebDriverOptions } from './browser-creator';
import { BrowserStackFullQueueErrorText } from '../exceptions';
import { getCapability } from './capabilities';

const N_SEC_SLEEP_BEFORE_RETRY = 30;

const browserStackHub = 'https://hub.browserstack.com/wd/hub';

const browsers: Record<string, WebdriverIO.Capabilities> = {
  Firefox: {
    browserName: 'firefox',
    // Leave blank so we get the latest version. 'beta' is also a valid option
    // browserVersion: '69.0',
    'bstack:options': {
      seleniumVersion: '4.25.0',
      os: 'Windows',
      osVersion: '10',
    },
  },
  Chrome: {
    browserName: 'chrome',
    // Leave blank so we get the latest version. 'beta' is also a valid option
    // browserVersion: '75.0',
    'bstack:options': {
      seleniumVersion: '3.5.2',
      os: 'Windows',
      osVersion: '10',
    },
  },
  Safari: {
    browserName: 'safari',
    browserVersion: '16.5',
    'bstack:options': {
      seleniumVersion: '3.141.59',
      os: 'OS X',
      osVersion: 'Monterey',
    },
  },
  IE11: {
    browserName: 'internet explorer',
    browserVersion: '11.0',
    'bstack:options': {
      seleniumVersion: '3.141.59',
      ie: {
        driver: '3.141.59',
      },
      os: 'Windows',
      osVersion: '8.1',
    },
  },
  IE11Win7: {
    browserName: 'internet explorer',
    browserVersion: '11.0',
    'bstack:options': {
      seleniumVersion: '3.141.59',
      ie: {
        driver: '3.141.59',
      },
      os: 'Windows',
      osVersion: '7',
    },
  },
  Edge: {
    browserName: 'edge',
    browserVersion: '18.0',
    'bstack:options': {
      seleniumVersion: '3.5.2',
      os: 'Windows',
      osVersion: '10',
    },
  },
};

type BrowserstackCredentials = {
  user: string;
  key: string;
};
export type BrowserstackOptions = {
  credentials: BrowserstackCredentials;
  nSecSleepBeforeRetry?: number;
  projectName: string;
  buildName: string;
};
export default class BrowserStackBrowserCreator extends BrowserCreator {
  async getBrowser(options: Partial<WebDriverOptions>): Promise<WebdriverIO.Browser> {
    const nSecSleepBeforeRetry = this.options.nSecSleepBeforeRetry || N_SEC_SLEEP_BEFORE_RETRY;

    return pRetry(
      async () => {
        try {
          const browser = await this.setupBrowser(options);
          return browser;
        } catch (error) {
          if (error instanceof Error && error.message.indexOf(BrowserStackFullQueueErrorText) > -1) {
            throw error;
          }
          throw new AbortError(error as Error);
        }
      },
      {
        minTimeout: nSecSleepBeforeRetry * 1000,
      }
    );
  }

  async __getBrowserUrl() {
    return new URL(browserStackHub);
  }

  protected __getCapabilities(): WebdriverIO.Capabilities {
    const capabilities = getCapability(this.browserName, browsers);
    const browserstackOptions = this.options as BrowserstackOptions;
    return {
      ...capabilities,
      'bstack:options': {
        ...('bstack:options' in capabilities ? capabilities['bstack:options'] : {}),
        projectName: browserstackOptions.projectName,
        buildName: browserstackOptions.buildName,
        userName: browserstackOptions.credentials.user,
        accessKey: browserstackOptions.credentials.key,
      },
    };
  }
}
