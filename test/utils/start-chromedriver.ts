// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import dns from 'dns';
import { startWebdriver } from '../../dist/chrome-launcher';
import { chromeDriverPort } from './config';

export default async () => {
  dns.setDefaultResultOrder('ipv4first');
  await startWebdriver(chromeDriverPort);
};
