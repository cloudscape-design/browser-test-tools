// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import './wdio-mock';
import DeviceFarmClientMock from 'aws-sdk/clients/devicefarm';
import DevicefarmBrowserCreator from '../../src/browsers/devicefarm';

const browserName = 'Chrome';

describe('Devicefarm browserCreator ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw if retries limit exceeded', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'throttling', retryCount: 1 });
    await expect(browserCreator.getBrowser({})).rejects.toThrow('ThrottlingException');
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(2);
  });

  test('should throw if devicefarm returned an invalid response', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'invalid' });
    await expect(browserCreator.getBrowser({})).rejects.toThrow('Invalid response from devicefarm: {"invalid":true}');
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(1);
  });

  test('should throw if client returns unknown error', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'unknown' });
    await expect(browserCreator.getBrowser({})).rejects.toThrow('unknown error');
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(1);
  });

  test('should return grid url in case of success', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'pass' });
    const browser = await browserCreator.getBrowser({});
    expect(browser.options).toEqual(
      expect.objectContaining({
        hostname: 'localhost',
        path: '/devicefarm-test-grid',
        port: 4444,
        protocol: 'http',
      })
    );
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(1);
  });
});
