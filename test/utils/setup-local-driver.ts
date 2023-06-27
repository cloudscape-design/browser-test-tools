// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { chromeDriverPort } from './config';
import { configure } from '../../src/use-browser';

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
