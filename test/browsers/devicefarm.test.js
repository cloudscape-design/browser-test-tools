// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { URL } = require('url');
const DeviceFarmClientMock = require('aws-sdk/clients/devicefarm');
const DevicefarmBrowserCreator = require('../../src/browsers/devicefarm').default;
const browserName = 'Chrome';

describe('Devicefarm browserCreator ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should throw if retries limit exceeded', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'throttling', retryCount: 1 });
    await expect(browserCreator.__getBrowserUrl()).rejects.toThrow('ThrottlingException');
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(2);
  });

  test('should throw if devicefarm returned an invalid response', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'invalid' });
    await expect(browserCreator.__getBrowserUrl()).rejects.toThrow(
      'Invalid response from devicefarm: {"invalid":true}'
    );
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(1);
  });

  test('should throw if client returns unknown error', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'unknown' });
    await expect(browserCreator.__getBrowserUrl()).rejects.toThrow('unknown error');
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(1);
  });

  test('should return grid url in case of success', async () => {
    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'pass' });
    const browser = await browserCreator.__getBrowserUrl();
    expect(browser).toEqual(expect.any(URL));
    expect(DeviceFarmClientMock.prototype.createTestGridUrl).toHaveBeenCalledTimes(1);
  });
});
