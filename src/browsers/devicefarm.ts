// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import { DeviceFarm } from '@aws-sdk/client-device-farm';
import BrowserCreator from './browser-creator';
import defaultCapabilities, { Capabilities, getCapability } from './capabilities';
import { FatalError } from '../exceptions';

export interface DevicefarmOptions {
  retryCount?: number;
  projectArn: string;
  expiresInSeconds?: number;
}

export default class DevicefarmBrowserCreator extends BrowserCreator {
  protected async __getBrowserUrl(): Promise<URL> {
    const options = this.options as DevicefarmOptions;
    const client = new DeviceFarm({ region: 'us-west-2' });

    const response = await client.createTestGridUrl({
      projectArn: options.projectArn,
      expiresInSeconds: options.expiresInSeconds || 300,
    });

    if (!response.url) {
      throw new FatalError('Invalid response from devicefarm: ' + JSON.stringify(response));
    }
    return new URL(response.url);
  }

  protected __getCapabilities(): Capabilities {
    return getCapability(this.browserName, defaultCapabilities);
  }
}
