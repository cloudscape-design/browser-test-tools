// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as browsers from './browsers';
import { SeleniumUrlOptions } from './browsers/browser-creator';
import { BrowserstackOptions } from './browsers/browserstack';
import { DevicefarmOptions } from './browsers/devicefarm';
import { FatalError } from './exceptions';

// Each provider is paired with the options shape its creator expects. Modelling
// this as a discriminated union lets the compiler verify that the right options
// are passed for the selected provider, without any casts.
export type BrowserProviderConfig =
  | { seleniumType: 'browserstack'; browserCreatorOptions: BrowserstackOptions }
  | { seleniumType: 'devicefarm'; browserCreatorOptions: DevicefarmOptions }
  | { seleniumType: 'devicefarmMobile'; browserCreatorOptions: SeleniumUrlOptions }
  | { seleniumType: 'local'; browserCreatorOptions: SeleniumUrlOptions };

export default function getBrowserCreator(browserName = 'ChromeHeadless', config: BrowserProviderConfig) {
  switch (config.seleniumType) {
    case 'browserstack':
      return new browsers.browserstack(browserName, config.browserCreatorOptions);
    case 'devicefarm':
      return new browsers.devicefarm(browserName, config.browserCreatorOptions);
    case 'devicefarmMobile':
      return new browsers.devicefarmMobile(browserName, config.browserCreatorOptions);
    case 'local':
      return new browsers.local(browserName, config.browserCreatorOptions);
    default:
      throw new FatalError('Incorrect selenium provider: ' + JSON.stringify(config));
  }
}
