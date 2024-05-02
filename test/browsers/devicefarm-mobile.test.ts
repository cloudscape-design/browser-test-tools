// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';
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

  test.each([{ platform: 'Android' }, { platform: 'iOS' }])('adds $platform capabilities', async () => {
    const browserCreator = new MobileBrowserCreator('Android', { seleniumUrl });

    const browser = await browserCreator.getBrowser({});
    expect((browser.options.capabilities as any)['appium:platformName']).toEqual('Android');
  });
});
