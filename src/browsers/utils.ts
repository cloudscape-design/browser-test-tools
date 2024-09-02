// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { WebDriverOptions } from './browser-creator';

// added after release of Firefox 129 to mitigate viewport shrinking
export const FIREFOX_VIEWPORT_OFFSET = 134;

export const addFirefoxOffset = (options: WebDriverOptions): WebDriverOptions => {
  const updatedHeight = options.height + FIREFOX_VIEWPORT_OFFSET;
  return {
    ...options,
    height: updatedHeight,
  };
};
