// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { remoteMock } from './wdio-mock';
import BrowserStackBrowserCreator from '../../src/browsers/browserstack';

const browserName = 'Chrome';
const browserOptions = {
  width: 1200,
  height: 604,
  needsKeyboard: false,
  implicitTimeout: 100,
  nSecSleepBeforeRetry: 0.001,
  projectName: 'project',
  credentials: { user: 'my-user', key: 'my-key' },
};

describe('BrowserStack browserCreator ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should try to reconnect in case of a full BrowserStack queue', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    remoteMock.mockReturnValue(
      Promise.reject(
        new Error(
          'All parallel tests are currently in use, including the queued tests. Please wait to finish or upgrade your plan to add more sessions.'
        )
      )
    );
    expect(remoteMock).toHaveBeenCalledTimes(0);
    await expect(browserCreator.getBrowser({})).rejects.toThrow('All parallel tests are currently in use');
    expect(remoteMock).toHaveBeenCalledTimes(11);
  });

  test('should not try to reconnect if any other error than a full BrowserStack queue gets thrown', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    remoteMock.mockReturnValue(Promise.reject(new Error('Some other error that we should accept without retrying')));
    expect(remoteMock).toHaveBeenCalledTimes(0);
    await expect(browserCreator.getBrowser({})).rejects.toThrow(/Some other error/);
    expect(remoteMock).toHaveBeenCalledTimes(1);
  });

  test('should propagate configuration to browser stack', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    const browser = await browserCreator.getBrowser({});

    expect(browser.options).toEqual(
      expect.objectContaining({
        capabilities: {
          browserName: 'chrome',
          'bstack:options': expect.objectContaining({
            projectName: 'project',
            userName: 'my-user',
            accessKey: 'my-key',
          }),
        },
        hostname: 'hub.browserstack.com',
        path: '/wd/hub',
        port: 80,
        protocol: 'http',
      })
    );
  });
});
