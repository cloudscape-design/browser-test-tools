// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import dns from 'node:dns';
import { startWebdriverNew, shutdownWebdriver } from '../../lib/chrome-launcher';
import { chromeDriverPort } from './config';

export async function setup() {
  // Make sure to favor IPv4 name resolution over IPv6 so that the localhost debugger can be found.
  dns.setDefaultResultOrder('ipv4first');
  await startWebdriverNew(chromeDriverPort);
}

export function teardown() {
  shutdownWebdriver();
}
