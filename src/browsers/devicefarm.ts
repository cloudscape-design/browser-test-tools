// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import pRetry, { AbortError } from 'p-retry';
import DeviceFarm from 'aws-sdk/clients/devicefarm';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { AWSError } from 'aws-sdk/lib/error';
import BrowserCreator from './browser-creator';
import defaultCapabilities, { getCapability } from './capabilities';
import { FatalError } from '../exceptions';
import type { Capabilities } from '@wdio/types';

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
  credentials: CredentialsOptions;
}

export default class DevicefarmBrowserCreator extends BrowserCreator {
  protected async __getBrowserUrl(): Promise<URL> {
    const options = this.options as DevicefarmOptions;
    const client = new DeviceFarm({ credentials: options.credentials, region: 'us-west-2' });

    const response = await pRetry(
      async () => {
        try {
          const response = await client
            .createTestGridUrl({
              projectArn: options.projectArn,
              expiresInSeconds: options.expiresInSeconds || 300,
            })
            .promise();
          return response;
        } catch (error) {
          if (isAWSError(error) && error.code === 'ThrottlingException') {
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

function isAWSError(obj: unknown): obj is AWSError {
  return obj instanceof Error && typeof (obj as { code?: string })['code'] === 'string';
}
