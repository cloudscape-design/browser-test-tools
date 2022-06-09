// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ElementRect } from '../page-objects/types';

export function realize(rect: ElementRect, pixelRatio: number): ElementRect {
  const result = { ...rect };

  Object.keys(result).forEach(key => {
    const elementKey = key as keyof ElementRect;
    result[elementKey] = result[elementKey] * pixelRatio;
  });

  return result;
}

export function round(rect: ElementRect): ElementRect {
  const result = { ...rect };

  Object.keys(result).forEach(key => {
    const elementKey = key as keyof ElementRect;
    result[elementKey] = Math.round(result[elementKey]);
  });

  return result;
}

export function getMaskForScrollOffset(
  viewportWidth: number,
  viewportHeight: number,
  scrollPageHeight: number,
  pageHeight: number
): ElementRect {
  // The last image contains parts of the second large image bc
  // it was not possible to scroll a full page. Thereby, we want to
  // mask the top of the image
  const top = scrollPageHeight - (pageHeight % scrollPageHeight);
  return {
    top,
    bottom: 0,
    width: viewportWidth,
    height: viewportHeight - top,
    left: 0,
    right: 0,
  };
}

// Includes time, network status
const statusBarHeight = 47 * 3;
// Includes address bar and navigation controls
const addressBarHeight = 133 * 3;

export function getMaskForIos(viewportWidth: number, viewportHeight: number): ElementRect {
  const top = statusBarHeight;
  const bottom = addressBarHeight;
  return {
    top,
    bottom,
    width: viewportWidth,
    height: viewportHeight - top - bottom,
    left: 0,
    right: 0,
  };
}
