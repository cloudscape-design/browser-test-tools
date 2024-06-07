// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { remote, RemoteOptions } from 'webdriverio';
import merge from 'lodash/merge';

import { BrowserError } from '../exceptions';
import { Capabilities } from './capabilities';

export interface WebDriverOptions {
  width: number;
  height: number;
  needsKeyboard: boolean;
  implicitTimeout: number;
  scriptTimeout: number;
  baseUrl?: string;
  logLevel: RemoteOptions['logLevel'];
  capabilities?: Record<string, any>;
}

const defaultOptions: WebDriverOptions = {
  width: 1200,
  height: 604,
  needsKeyboard: false,
  implicitTimeout: 5000,
  scriptTimeout: 30000,
  logLevel: 'error',
};

export default abstract class BrowserCreator {
  constructor(protected browserName: string, protected options: Record<string, any>) {}

  protected async setupBrowser(overrides: Partial<WebDriverOptions>) {
    const options = merge({}, defaultOptions, overrides);
    const desiredCapabilities = merge({}, this.__getCapabilities(), overrides.capabilities);
    const { protocol, hostname, port, pathname } = await this.__getBrowserUrl();
    const defaultPort = protocol === 'http:' ? 80 : 443;

    console.log({ protocol, hostname, port, pathname });

    const browser = await remote({
      logLevel: options.logLevel,
      baseUrl: options.baseUrl,
      // iOS devices can take 2-3 minutes to boot
      connectionRetryTimeout: 240_000,
      connectionRetryCount: 3,
      waitforTimeout: 5000,
      capabilities: desiredCapabilities,
      protocol: protocol.replace(/:$/, ''),
      hostname,
      port: +port || defaultPort,
      path: pathname,
    });

    console.log('After calling remote');

    await browser.setTimeout({ implicit: options.implicitTimeout, script: options.scriptTimeout });

    if (!browser.isMobile) {
      await browser.$('body').then(body => body.moveTo({ xOffset: 0, yOffset: 0 }));
      await browser.setWindowSize(options.width, options.height);
    }

    return browser;
  }

  public async getBrowser(options: Partial<WebDriverOptions>) {
    try {
      return this.setupBrowser(options);
    } catch (error) {
      // log error here, because later it will be caught
      console.error(error);

      if (error instanceof Error) {
        throw new BrowserError(error.message, error);
      } else {
        throw error;
      }
    }
  }

  protected abstract __getBrowserUrl(): Promise<URL>;
  protected abstract __getCapabilities(): Capabilities;
}
