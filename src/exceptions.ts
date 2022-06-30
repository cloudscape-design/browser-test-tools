// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#ES6_Custom_Error_Class
class CustomError extends Error {
  constructor(message: string, error?: Error) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }

    if (error) {
      this.stack = (this.stack || '') + error.stack;
      this.message += `: ${error.message}`;
    }
  }
}

// Can originate from issues that arise during screenshot taking, does
// not cover test failures, we use assertions for that.
// Requires retry
export class ScreenshotTakeError extends CustomError {}

// Used for rethrowing browser exceptions
// Requires retry
export class BrowserError extends CustomError {}

// A family of errors that will not cause test runner to retry a failed test
export class FatalError extends CustomError {}

// Can originate from generic file handling and image processing
// Does not require retry
export class FileHandlingError extends FatalError {}

// Used for managing control flow, developer experience and diagnostics
// Does not require retry
export class DiagnosticsError extends FatalError {}

export const BrowserStackFullQueueErrorText =
  'All parallel tests are currently in use, including the queued tests. Please wait to finish or upgrade your plan to add more sessions.';

// https://github.com/webdriverio/webdriverio/blob/f9eae7a6747b4bf55975a891f25643bba2165936/packages/webdriverio/src/commands/browser/getPuppeteer.ts#L123
export const WebdriverIoUnsupportedPuppeteerErrorText =
  'Using DevTools capabilities is not supported for this session.';

export const WebdriverIoRemotePuppeteerErrorText = "Could't find remote debug port in Firefox options";
