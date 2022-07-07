// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import { packPng } from './pngs';
import { ElementOffset, ElementRect } from '../page-objects/types';
import { ScreenshotTakeError } from '../exceptions';
import { hasMoreThanOneColor } from './check';

export async function cropByOffset(encodedImage: PNG, offset: ElementOffset) {
  const rect: ElementRect = {
    top: offset.top,
    left: offset.left,
    bottom: encodedImage.height,
    right: encodedImage.width,
    height: encodedImage.height - offset.top,
    width: encodedImage.width - offset.left,
  };

  return cropByRect(encodedImage, rect);
}

export async function cropByRect(encodedImage: PNG, rect: ElementRect) {
  const image = await safeCropImage(encodedImage, rect);
  return packPng(image);
}
/**
 * Crops an image with safety measures reducing rect to be valid mask for
 * the image. Throws error if picture contains only one color.
 * @param inImage to be cropped
 * @param rect to use as mask on the image
 * @returns cropped image
 */
export function safeCropImage(inImage: PNG, rect: ElementRect) {
  const safeTop = Math.max(0, Math.min(rect.top, inImage.height - 1));
  const safeLeft = Math.max(0, Math.min(rect.left, inImage.width - 1));
  const safeWidth = Math.max(1, Math.min(rect.width, inImage.width - safeLeft));
  const safeHeight = Math.max(1, Math.min(rect.height, inImage.height - safeTop));

  // The outImage keeps the requested width and height, which can be bigger than the
  // rect on the inImage. However, this is to produce screenshots of equal dimensions.
  const outImage = new PNG({ width: rect.width, height: rect.height });
  inImage.bitblt(outImage, safeLeft, safeTop, safeWidth, safeHeight, 0, 0);
  // An image with a single color might be an indicator that we took a screenshot
  // of the wrong area.
  if (!hasMoreThanOneColor(outImage)) {
    throw new ScreenshotTakeError('Image does not contain enough colors');
  }
  return outImage;
}
/**
 * Crops image by rect. Make sure rect is a valid mask for the image.
 * @param inImage to be cropped
 * @param param1 to use as mask on the image
 * @returns cropped image
 */
export function cropImage(inImage: PNG, { width, height, top, left }: ElementRect) {
  const outImage = new PNG({ width, height });

  inImage.bitblt(outImage, left, top, width, height, 0, 0);

  return outImage;
}
