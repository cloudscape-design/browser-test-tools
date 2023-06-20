// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, test, expect, vi } from 'vitest';

import { URL } from 'url';

import {
  DeviceFarmClient,
  CreateTestGridUrlCommand,
  DeviceFarmServiceException,
  CreateTestGridUrlCommandOutput,
} from '@aws-sdk/client-device-farm';

import { mockClient } from 'aws-sdk-client-mock';

import DevicefarmBrowserCreator from '../../src/browsers/devicefarm';

const browserName = 'Chrome';
const deviceFarmClientMock = mockClient(DeviceFarmClient);

describe('Devicefarm browserCreator ', () => {
  beforeEach(() => {
    deviceFarmClientMock.reset();
    vi.restoreAllMocks();
  });

  test('should throw if retries limit exceeded', async () => {
    const exception = new DeviceFarmServiceException({
      name: 'DeviceFarm',
      $fault: 'server',
      $metadata: {},
    });

    exception.$retryable = { throttling: true };
    deviceFarmClientMock.on(CreateTestGridUrlCommand).rejects(exception);

    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'throttling', retryCount: 1 });
    await expect((browserCreator as any).__getBrowserUrl()).rejects.toThrow();
  });

  test('should throw if devicefarm returned an invalid response', async () => {
    deviceFarmClientMock.on(CreateTestGridUrlCommand).resolves({} as CreateTestGridUrlCommandOutput);

    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'invalid' });
    await expect((browserCreator as any).__getBrowserUrl()).rejects.toThrow('Invalid response from devicefarm: {}');
  });

  test('should throw if client returns unknown error', async () => {
    deviceFarmClientMock.on(CreateTestGridUrlCommand).rejects('unknown error');

    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'unknown' });
    await expect((browserCreator as any).__getBrowserUrl()).rejects.toThrow('unknown error');
  });

  test('should return grid url in case of success', async () => {
    deviceFarmClientMock.on(CreateTestGridUrlCommand).resolves({ url: 'https://example.com' });

    const browserCreator = new DevicefarmBrowserCreator(browserName, { projectArn: 'pass' });
    const browser = await (browserCreator as any).__getBrowserUrl();
    expect(browser).toEqual(expect.any(URL));
  });
});
