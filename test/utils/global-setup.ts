// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import startChromedriver from './start-chromedriver';
import stopChromedriver from './stop-chromedriver';

export async function setup() {
  return startChromedriver();
}

export async function teardown() {
  return stopChromedriver();
}
