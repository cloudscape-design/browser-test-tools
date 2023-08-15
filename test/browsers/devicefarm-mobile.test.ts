// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import './wdio-mock';
import MobileBrowserCreator from '../../src/browsers/devicefarm-mobile';

const seleniumUrl = 'http://localhost:4444/wd';

describe('Mobile Devicefarm browserCreator', () => {
  test('can pass down browser options', async () => {
    const browserCreator = new MobileBrowserCreator('iOS', { seleniumUrl });

    const browser = await browserCreator.getBrowser({});
    expect(browser.options).toEqual(
      expect.objectContaining({
        hostname: 'localhost',
        path: '/wd',
        port: 4444,
        protocol: 'http',
      })
    );
  });

  test.each([{ platform: 'Android' }, { platform: 'iOS' }])('adds $platform capabilities', async ({ platform }) => {
    const browserCreator = new MobileBrowserCreator(platform, { seleniumUrl });

    const browser = await browserCreator.getBrowser({});
    expect((browser.options.capabilities as any)['appium:platformName']).toEqual(platform);

    if (platform === 'Android') {
      expect(browser.updateSettings).not.toBeCalled();
    } else {
      expect(browser.updateSettings).toBeCalledWith({ safariTabBarPosition: 'bottom' });
    }
  });
});
