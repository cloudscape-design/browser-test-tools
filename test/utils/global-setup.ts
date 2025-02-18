// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import dns from 'node:dns';
import allureCmd from 'allure-commandline';
import { startWebdriver, shutdownWebdriver } from '../../lib/chrome-launcher';
import { chromeDriverPort } from './config';
import path from 'node:path';

async function allureGenerate() {
  process.env.ALLURE_NO_ANALYTICS = 'true';
  const generation = allureCmd([
    'generate',
    '--clean',
    '--report-dir',
    path.resolve('build/allure-report'),
    path.resolve('build/allure-results'),
  ]);

  return new Promise((resolve, reject) => {
    const generationTimeout = setTimeout(() => reject(new Error('Allure generation took longer than expected')), 60000);

    generation.on('exit', exitCode => {
      clearTimeout(generationTimeout);

      console.log('Allure report generation is finished with code:', exitCode);
      resolve(exitCode);
    });
  });
}

export async function setup() {
  // Make sure to favor IPv4 name resolution over IPv6 so that the localhost debugger can be found.
  dns.setDefaultResultOrder('ipv4first');
  await startWebdriver(chromeDriverPort);
}

export function teardown() {
  shutdownWebdriver();
  allureGenerate();
}
