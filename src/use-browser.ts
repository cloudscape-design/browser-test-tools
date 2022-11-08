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
};
const options: BrowserOptions = {
  browserName: 'ChromeHeadless',
  seleniumType: 'local',
  browserCreatorOptions: {},
  webdriverOptions: {},
};

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
      if ('getLogs' in browser) {
        const logs = (await browser.getLogs('browser')) as Array<{ level: string }>;
        const errors = logs.filter(entry => entry.level === 'SEVERE');
        if (errors.length > 0) {
          throw new Error('Unexpected errors in browser console:\n' + JSON.stringify(errors, null, 2));
        }
      } else {
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
