// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PNG } from 'pngjs';
/**
 *
 * @param img to be checked
 * @returns true if image contains more than one color
 */
export function hasMoreThanOneColor(img: PNG) {
  const pixels = img.data;
  let lastColor;
  for (let i = 0; i < pixels.length; i += 4) {
    const color = (pixels[i] << 24) + (pixels[i + 1] << 16) + (pixels[i + 2] << 8) + pixels[i + 3];
    if (!lastColor) {
      lastColor = color;
    } else if (color !== lastColor) {
      return true;
    }
  }
  return false;
}
