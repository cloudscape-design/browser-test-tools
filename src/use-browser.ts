// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { WebDriverOptions } from './browsers/browser-creator';
import getBrowserCreator from './browser';
import merge from 'lodash/merge';

type BrowserOptions = {
  browserName: string;
  seleniumType: string;
  browserCreatorOptions: Record<string, any>;
  webdriverOptions: Partial<WebDriverOptions>;
  skipConsoleErrorsCheck: boolean;
};
const options: BrowserOptions = {
  browserName: 'ChromeHeadless',
  seleniumType: 'local',
  browserCreatorOptions: {},
  webdriverOptions: {},
  skipConsoleErrorsCheck: false,
};

// The errors like { "level": "SEVERE", "source": "network", "message": "http://localhost:8080/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)" }
// originate in Chromium when using new headless mode. We ignore them as non-severe.
function isFaviconError(error: Record<string, unknown>) {
  const testMessages = ['favicon.ico - Failed to load resource', 'favicon.svg - Failed to load resource'];
  const isNetworkError = 'source' in error && error.source === 'network';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  return isNetworkError && testMessages.some(test => message.includes(test));
}

interface TestFunction {
  (browser: WebdriverIO.Browser): Promise<void> | void;
}

function useBrowser(optionsOverride: Partial<WebDriverOptions>, testFn: TestFunction): () => Promise<void>;
function useBrowser(testFn: TestFunction): () => Promise<void>;
function useBrowser(...args: [Partial<WebDriverOptions>, TestFunction] | [TestFunction]) {
  // How to do type-safe function overloads: https://stackoverflow.com/questions/55852612/typescript-overloads-optional-arguments-and-type-inference
  const optionsOverride = args.length === 1 ? {} : args[0];
  const testFn = args.length === 1 ? args[0] : args[1];
  return async () => {
    const creator = getBrowserCreator(options.browserName, options.seleniumType, options.browserCreatorOptions);
    const browser = await creator.getBrowser({ ...options.webdriverOptions, ...optionsOverride });

    try {
      if ('getLogs' in browser) {
        // dispose logs from previous sessions, if there are any
        await browser.getLogs('browser');
      }
      await testFn(browser);
      // This method does not exist in w3c protocol
      if (!options.skipConsoleErrorsCheck && 'getLogs' in browser) {
        const logs = (await browser.getLogs('browser')) as Array<{ level: string }>;
        const errors = logs.filter(entry => entry.level === 'SEVERE' && !isFaviconError(entry));
        if (errors.length > 0) {
          throw new Error('Unexpected errors in browser console:\n' + JSON.stringify(errors, null, 2));
        }
      } else if (!options.skipConsoleErrorsCheck) {
        console.warn('Unable to check browser console, webdriver does not support this feature');
      }
    } finally {
      await browser.deleteSession();
    }
  };
}

export default useBrowser;
export function configure(newOptions: Partial<BrowserOptions>) {
  merge(options, newOptions);
}
