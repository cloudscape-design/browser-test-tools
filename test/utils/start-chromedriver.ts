// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { startWebdriver } from '../../dist/chrome-launcher';
import { chromeDriverPort } from './config';

export default async () => {
  await startWebdriver(chromeDriverPort);
};
