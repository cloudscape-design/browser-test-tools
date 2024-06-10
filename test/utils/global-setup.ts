// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import dns from 'node:dns';
import { startWebdriver, shutdownWebdriver } from '../../lib/chrome-launcher';
import { chromeDriverPort } from './config';
console.log('setup imported', performance.now());

export async function setup() {
  console.log('setup', performance.now());
  // Make sure to favor IPv4 name resolution over IPv6 so that the localhost debugger can be found.
  dns.setDefaultResultOrder('ipv4first');
  console.log('startWebdriver', performance.now());
  await startWebdriver(chromeDriverPort);
}

export function teardown() {
  console.log('shutdownWebdriver', performance.now());
  shutdownWebdriver();
}
