// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export interface ScrollPosition {
  top: number;
  left: number;
}

export function scrollToBottom(selector: string) {
  var element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }

  element.scrollTop = element.scrollHeight;
}

export function scrollToRight(selector: string) {
  var element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }

  element.scrollLeft = element.scrollWidth;
}

export function elementScrollTo(selector: string, top: number, left: number) {
  var element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }
  element.scrollTop = top;
  element.scrollLeft = left;
}

export function getElementScrollPosition(selector: string): ScrollPosition {
  var element = document.querySelector(selector);
  if (!element) {
    // We cannnot use our custom error types as they are not available inside the browser context
    throw new Error('Element ' + selector + ' has not been found at the page');
  }
  return { top: element.scrollTop, left: element.scrollLeft };
}

export function windowScrollTo(top: number, left: number) {
  window.scrollTo(left, top);
}

export function getWindowScrollPosition(): ScrollPosition {
  return { top: window.pageYOffset, left: window.pageXOffset };
}
