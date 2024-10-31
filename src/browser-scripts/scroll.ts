// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export interface ScrollPosition {
  top: number;
  left: number;
}

export function scrollAction(
  action: 'scrollToOffset' | 'scrollToRight' | 'scrollToBottom',
  selector: string,
  offset?: { top: number; left: number }
) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }
  if (!['auto', 'scroll'].includes(getComputedStyle(element).overflow) && element !== document.documentElement) {
    throw new Error('Element ' + selector + ' is not scrollable');
  }
  switch (action) {
    case 'scrollToOffset':
      if (!offset) {
        throw new Error('Cannot scroll to offset without an offset');
      }
      element.scrollTop = offset.top;
      element.scrollLeft = offset.left;
      break;
    case 'scrollToBottom':
      element.scrollTop = element.scrollHeight;
      break;
    case 'scrollToRight':
      element.scrollLeft = element.scrollWidth;
      break;
    default:
      throw new Error(`Unsupported scroll action ${action}`);
  }
}

export function getElementScrollPosition(selector: string): ScrollPosition {
  var element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }
  if (getComputedStyle(element).overflow !== 'auto') {
    throw new Error('Element ' + selector + ' is not scrollable');
  }
  return { top: element.scrollTop, left: element.scrollLeft };
}

export function windowScrollTo(top: number, left: number) {
  window.scrollTo(left, top);
}

export function getWindowScrollPosition(): ScrollPosition {
  return { top: window.pageYOffset, left: window.pageXOffset };
}
