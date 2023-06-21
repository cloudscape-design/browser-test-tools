// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import BrowserStackBrowserCreator from '../../src/browsers/browserstack';

const browserName = 'Chrome';
const browserOptions = {
  width: 1200,
  height: 604,
  needsKeyboard: false,
  implicitTimeout: 100,
  nSecSleepBeforeRetry: 0.001,
};

describe('BrowserStack browserCreator ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should try to reconnect in case of a full BrowserStack queue', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    const setupBrowserSpy = jest.spyOn(browserCreator, 'setupBrowser').mockImplementation(() => {
      return Promise.reject(
        new Error(
          'All parallel tests are currently in use, including the queued tests. Please wait to finish or upgrade your plan to add more sessions.'
        )
      );
    });

    expect(setupBrowserSpy).toHaveBeenCalledTimes(0);
    await expect(browserCreator.getBrowser({})).rejects.toThrow('All parallel tests are currently in use');
    expect(setupBrowserSpy).toHaveBeenCalledTimes(11);
  });

  test('should not try to reconnect if any other error than a full BrowserStack queue gets thrown', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    const setupBrowserSpy = jest.spyOn(browserCreator, 'setupBrowser').mockImplementation(() => {
      return Promise.reject(new Error('Some other error that we should accept without retrying'));
    });

    expect(setupBrowserSpy).toHaveBeenCalledTimes(0);
    await expect(browserCreator.getBrowser({})).rejects.toThrow();
    expect(setupBrowserSpy).toHaveBeenCalledTimes(1);
  });

  test('should use BrowserStack hub url', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, browserOptions);
    const url = await browserCreator.__getBrowserUrl();

    expect(url.hostname).toBe('hub.browserstack.com');
  });

  test('should have BrowserStack specific capabilities', async () => {
    const browserCreator = new BrowserStackBrowserCreator(browserName, {
      ...browserOptions,
      projectName: 'project',
      credentials: { user: 'my-user', key: 'my-key' },
    });

    const capabilities = browserCreator.__getCapabilities();
    expect(capabilities['bstack:options']).toEqual(
      expect.objectContaining({
        projectName: 'project',
        userName: 'my-user',
        accessKey: 'my-key',
      })
    );
  });
});
