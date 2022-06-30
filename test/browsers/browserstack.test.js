// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const BrowserStackBrowserCreator = require('../../src/browsers/browserstack').default;

const browserName = 'Chrome';
const browserOptions = {
  width: 1200,
  height: 604,
  needsKeyboard: false,
  implicitTimeout: 100,
  nSecSleepBeforeRetry: 0.001,
};

BrowserStackBrowserCreator.prototype.setupBrowser = jest.fn().mockImplementation(options => {
  const errorMessage = options.makeQueueFullErrorForTesting
    ? 'All parallel tests are currently in use, including the queued tests. Please wait to finish or upgrade your plan to add more sessions.'
    : 'Some other error that we should accept without retrying';

  return Promise.reject(new Error(errorMessage));
});

describe('BrowserStack browserCreator ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should try to reconnect in case of a full BrowserStack queue', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    expect(browserCreator.setupBrowser.mock.calls.length).toBe(0);
    await expect(browserCreator.getBrowser({ makeQueueFullErrorForTesting: true })).rejects.toThrow(
      'All parallel tests are currently in use'
    );
    expect(browserCreator.setupBrowser.mock.calls.length).toBe(11);
  });

  test('should not try to reconnect if any other error than a full BrowserStack queue gets thrown', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    expect(browserCreator.setupBrowser.mock.calls.length).toBe(0);
    await expect(browserCreator.getBrowser({})).rejects.toThrow();
    expect(browserCreator.setupBrowser.mock.calls.length).toBe(1);
  });
});
