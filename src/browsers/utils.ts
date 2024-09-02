// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { WebDriverOptions } from './browser-creator';

// with the release of Firefox 129 the viewport got smaller, which affects tests
// we adjust the default height to mitigate the issue
// todo: check if still needed after migration to webdriverio v9
export const FIREFOX_VIEWPORT_OFFSET = 134;

export const addFirefoxOffset = (options: WebDriverOptions): WebDriverOptions => {
  const updatedHeight = options.height + FIREFOX_VIEWPORT_OFFSET;
  return {
    ...options,
    height: updatedHeight,
  };
};
