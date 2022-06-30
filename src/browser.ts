// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as browsers from './browsers';
import { FatalError } from './exceptions';

function hasType(value: string): value is keyof typeof browsers {
  return value in browsers;
}

export default function getBrowserCreator(
  browserName = 'ChromeHeadless',
  seleniumType: string,
  options: Record<string, any>
) {
  if (!hasType(seleniumType)) {
    throw new FatalError('Incorrect selenium provider: ' + seleniumType);
  }
  const Creator = browsers[seleniumType];
  return new Creator(browserName, options);
}
