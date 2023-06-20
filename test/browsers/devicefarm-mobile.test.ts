// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, test, expect } from 'vitest';

import MobileBrowserCreator from '../../src/browsers/devicefarm-mobile';

const seleniumUrl = 'http://localhost:4444/wd';

describe('Mobile Devicefarm browserCreator', () => {
  test('can pass down selenium URL', async () => {
    const browserCreator = new MobileBrowserCreator('iOS', { seleniumUrl });

    const { hostname } = await browserCreator.__getBrowserUrl();
    expect(hostname).toBe('localhost');
  });

  test.each([{ platform: 'Android' }, { platform: 'iOS' }])('adds $platform capabilities', () => {
    const browserCreator = new MobileBrowserCreator('Android', { seleniumUrl });

    const capabilities = browserCreator.__getCapabilities();
    expect(capabilities['appium:platformName']).toBe('Android');
  });
});
