// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ElementOffset, ElementSize } from '../page-objects/types';

export interface PermutationInfo extends ElementSize {
  id: string;
  offset: ElementOffset;
}

export interface PageDimensions {
  pageHeight: number;
  viewportHeight: number;
}

export function getPermutationSizes(): PermutationInfo[] {
  var pixelRatio = window.devicePixelRatio || 1;
  return Array.prototype.slice
    .call(document.querySelectorAll('[data-permutation]'))
    .map(function (element: HTMLElement) {
      var rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute('data-permutation') || '',
        width: rect.width * pixelRatio,
        height: rect.height * pixelRatio,
        offset: {
          top: rect.top * pixelRatio,
          left: rect.left * pixelRatio,
        },
      };
    });
}

export function getPageDimensions(): PageDimensions {
  return {
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  };
}
