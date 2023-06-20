// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import pRetry, { AbortError } from 'p-retry';

import { AwsAuthInputConfig } from '@aws-sdk/middleware-signing';
import { DeviceFarmClient, CreateTestGridUrlCommand, DeviceFarmServiceException } from '@aws-sdk/client-device-farm';

import type { Capabilities } from '@wdio/types';

import BrowserCreator from './browser-creator';
import defaultCapabilities, { getCapability } from './capabilities';
import { FatalError } from '../exceptions';

// This uses undocumented options which prevents proper typing
const capabilities: Record<string, Capabilities.DesiredCapabilities> = {
  ...defaultCapabilities,
  IE11: {
    browserName: 'internet explorer',
  },
};

export interface DevicefarmOptions {
  retryCount?: number;
  projectArn: string;
  expiresInSeconds?: number;
  credentials: AwsAuthInputConfig['credentials'];
}

export default class DevicefarmBrowserCreator extends BrowserCreator {
  protected async __getBrowserUrl(): Promise<URL> {
    const options = this.options as DevicefarmOptions;
    const client = new DeviceFarmClient({ credentials: options.credentials, region: 'us-west-2' });

    const response = await pRetry(
      async () => {
        try {
          return await client.send(
            new CreateTestGridUrlCommand({
              projectArn: options.projectArn,
              expiresInSeconds: options.expiresInSeconds || 300,
            })
          );
        } catch (error) {
          if (error instanceof DeviceFarmServiceException && error.$retryable?.throttling) {
            // Retries with backoff when throttled
            throw error;
          }
          throw new AbortError(error as Error); // Abort on any other error
        }
      },
      { retries: options.retryCount || 10 }
    );

    if (!response.url) {
      throw new FatalError('Invalid response from devicefarm: ' + JSON.stringify(response));
    }

    return new URL(response.url);
  }

  protected __getCapabilities() {
    return getCapability(this.browserName, capabilities);
  }
}
