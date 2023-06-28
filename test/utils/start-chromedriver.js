// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { startWebdriver } = require('../../dist/chrome-launcher');
const { chromeDriverPort } = require('./config');

module.exports = async () => {
  await startWebdriver(chromeDriverPort);
};
