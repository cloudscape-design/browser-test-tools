// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import dns from 'dns';
import { startWebdriver } from '../../lib/chrome-launcher';
import { chromeDriverPort } from './config';

export default async () => {
  // Make sure to favor IPv4 name resolution over IPv6 so that the localhost debugger can be found.
  dns.setDefaultResultOrder('ipv4first');

  await startWebdriver(chromeDriverPort);
};
