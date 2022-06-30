// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
/*
 * This module is ignored by code coverage collection to avoid transformation
 * before injection into the browser context.
 */
declare function requestAnimationFrame(callback: FrameRequestCallback): number;

export function waitForTimerAndAnimationFrame(timeout: number, done: () => void) {
  setTimeout(function () {
    requestAnimationFrame(function () {
      done();
    });
  }, timeout);
}
