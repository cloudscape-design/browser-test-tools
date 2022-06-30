// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { URL } from 'url';
import BrowserCreator from './browser-creator';
import { getCapability } from './capabilities';
import type { Capabilities } from '@wdio/types';

// The remaining options like browserName, deviceName, etc. will be covered
// by default capabilities in DeviceFarm and/or the Appium server.
const mobileBrowsers: Record<string, Capabilities.DesiredCapabilities> = {
  iOS: {
    'appium:automationName': 'XCUITest',
    'appium:platformName': 'iOS',
    'appium:newCommandTimeout': 180,
  },
  Android: {
    'appium:automationName': 'UiAutomator2',
    'appium:platformName': 'Android',
    'appium:newCommandTimeout': 180,
  },
};

export default class MobileBrowserCreator extends BrowserCreator {
  async __getBrowserUrl() {
    return new URL(this.options.seleniumUrl);
  }

  __getCapabilities() {
    return getCapability(this.browserName, mobileBrowsers);
  }
}
