// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const MobileBrowserCreator = require('../../src/browsers/devicefarm-mobile').default;

describe('Mobile Devicefarm browserCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('can pass down selenium URL', async () => {
    const browserCreator = new MobileBrowserCreator('iOS', {
      seleniumUrl: 'http://localhost:1234/path',
    });

    const { hostname, path } = await browserCreator.getBrowser({});

    expect(hostname).toBe('localhost');
    expect(path).toBe('/path');
  });

  test('can pass down capabilities', async () => {
    const browserCreator = new MobileBrowserCreator('Android', {
      seleniumUrl: 'http://localhost:4444',
    });

    const { logLevel } = await browserCreator.getBrowser({
      logLevel: 'trace',
    });

    expect(logLevel).toBe('trace');
  });
});
