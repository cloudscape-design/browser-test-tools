// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import './wdio-mock';
import DevicefarmBrowserCreator from '../../src/browsers/devicefarm';

const createTestGridUrl = jest.fn();

jest.mock('@aws-sdk/client-device-farm', () => {
  class DeviceFarm {
    createTestGridUrl = createTestGridUrl;
  }
  return { DeviceFarm };
});

const browserName = 'Chrome';

describe('Devicefarm browserCreator ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw if devicefarm returned an invalid response', async () => {
    createTestGridUrl.mockReturnValue(Promise.resolve({ invalid: true }));
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'foo' });
    await expect(browserCreator.getBrowser({})).rejects.toThrow('Invalid response from devicefarm: {"invalid":true}');
    expect(createTestGridUrl).toHaveBeenCalledTimes(1);
  });

  test('should propagate errors from the client', async () => {
    createTestGridUrl.mockReturnValue(Promise.reject(new Error('unknown error')));
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'foo' });
    await expect(browserCreator.getBrowser({})).rejects.toThrow('unknown error');
    expect(createTestGridUrl).toHaveBeenCalledTimes(1);
  });

  test('should return grid url in case of success', async () => {
    createTestGridUrl.mockReturnValue(Promise.resolve({ url: 'http://localhost:4444/devicefarm-test-grid' }));
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'foo' });
    const browser = await browserCreator.getBrowser({});
    expect(browser.options).toEqual(
      expect.objectContaining({
        hostname: 'localhost',
        path: '/devicefarm-test-grid',
        port: 4444,
        protocol: 'http',
      })
    );
    expect(createTestGridUrl).toHaveBeenCalledTimes(1);
  });
});
