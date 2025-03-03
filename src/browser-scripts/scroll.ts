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

  const overflowDirection =
    action === 'scrollToOffset' ? 'overflow' : action === 'scrollToBottom' ? 'overflowY' : 'overflowX';

  const overflowStyles = getComputedStyle(element)[overflowDirection].split(' ');
  if (!overflowStyles.includes('auto') && !overflowStyles.includes('scroll') && element !== document.documentElement) {
    throw new Error(`Element ${selector} is not scrollable`);
  }

  if (overflowStyles.length === 2 && offset) {
    const hasErrorScrollX = !['auto', 'scroll'].includes(overflowStyles[0]) && offset.left > 0;
    const hasErrorScrollY = !['auto', 'scroll'].includes(overflowStyles[1]) && offset.top > 0;
    if (hasErrorScrollX || hasErrorScrollY) {
      throw new Error(`Element ${selector} is not scrollable in ${hasErrorScrollX ? 'left' : 'top'} direction`);
    }
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
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }

  const overflowStyles = getComputedStyle(element).overflow.split(' ');

  if (!overflowStyles.includes('auto') && !overflowStyles.includes('scroll')) {
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
