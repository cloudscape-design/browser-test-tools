// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ElementRect, ViewportSize } from '../page-objects/types';

export function getBoundingClientRect(selector: string): ElementRect {
  var element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }
  // These properties are lazy calculated in IE, we need call them to initialize
  var rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
}

export function getViewportSize(): ViewportSize {
  return {
    top: window.pageYOffset,
    left: window.pageXOffset,
    width: window.innerWidth,
    height: window.innerHeight,
    pageHeight: document.documentElement.scrollHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
  };
}
