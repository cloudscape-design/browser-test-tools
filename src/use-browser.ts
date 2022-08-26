// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { strict as assert } from 'assert';
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

interface TestFunctionApi {
  releaseBrowser: () => Promise<void>;
}

interface TestFunction {
  (browser: WebdriverIO.Browser, api: TestFunctionApi): Promise<void> | void;
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
      await disposeBrowserLogsFromPreviousSession(browser);

      let errors: null | { level: string }[] = null;

      await testFn(browser, {
        releaseBrowser: async () => {
          errors = await captureBrowserErrors(browser);
          browser.deleteSession();
        },
      });

      if (!errors) {
        errors = await captureBrowserErrors(browser);
      }

      assert.deepEqual(errors, [], 'There should be no errors in the console');
    } finally {
      await browser.deleteSession();
    }
  };
}

async function disposeBrowserLogsFromPreviousSession(browser: WebdriverIO.Browser) {
  // This method does not exist in w3c protocol
  if ('getLogs' in browser) {
    await browser.getLogs('browser');
  }
}

async function captureBrowserErrors(browser: WebdriverIO.Browser) {
  // This method does not exist in w3c protocol
  if ('getLogs' in browser) {
    const logs = (await browser.getLogs('browser')) as Array<{ level: string }>;
    const errors = logs.filter(entry => entry.level === 'SEVERE');
    return errors;
  } else {
    console.warn('Unable to check browser console, webdriver does not support this feature');
    return [];
  }
}

export default useBrowser;
export function configure(newOptions: Partial<BrowserOptions>) {
  merge(options, newOptions);
}
