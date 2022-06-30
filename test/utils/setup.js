// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { configure } = require('../../src/use-browser');
const { chromeDriverPort } = require('./config');

jest.setTimeout(80 * 1000);

beforeAll(async () => {
  configure({
    browserName: 'ChromeHeadless',
    browserCreatorOptions: {
      seleniumUrl: `http://localhost:${chromeDriverPort}`,
    },
    webdriverOptions: {
      baseUrl: `http://localhost:9615/`,
    },
  });
});
