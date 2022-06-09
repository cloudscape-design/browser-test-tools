// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { packPng } from './pngs';
import { ElementRect, ElementSize, ScreenshotWithOffset } from '../page-objects/types';
import { safeCropImage } from './crop';
import { round, realize } from './mask';

export function compareImages(firstImage: PNG, secondImage: PNG, { width, height }: ElementSize) {
  // fast path when two image files are identical
  if (firstImage.data.equals(secondImage.data)) {
    return { diffPixels: 0, diffImage: null };
  }
  const diffImage = new PNG({ width, height });
  const diffPixels = pixelmatch(firstImage.data, secondImage.data, diffImage.data, width, height, { threshold: 0.01 });
  return { diffPixels, diffImage };
}

function normalizeSize(firstScreenshot: ScreenshotWithOffset, secondScreenshot: ScreenshotWithOffset) {
  return {
    height: Math.round(Math.max(firstScreenshot.height, secondScreenshot.height)),
    width: Math.round(Math.max(firstScreenshot.width, secondScreenshot.width)),
  };
}

function scaleSize(size: ElementSize, pixelRatio: number) {
  return {
    width: Math.ceil(size.width * pixelRatio),
    height: Math.ceil(size.height * pixelRatio),
  };
}

export interface CropAndCompareResult {
  firstImage: Buffer;
  secondImage: Buffer;
  diffImage: Buffer | null;
  isEqual: boolean;
  diffPixels: number;
}

export async function cropAndCompare(
  firstScreenshot: ScreenshotWithOffset,
  secondScreenshot: ScreenshotWithOffset
): Promise<CropAndCompareResult> {
  const size = normalizeSize(firstScreenshot, secondScreenshot);
  const firstImageCropRect: ElementRect = {
    height: size.height,
    width: size.width,
    bottom: firstScreenshot.offset.top + size.height,
    right: firstScreenshot.offset.left + size.width,
    top: firstScreenshot.offset.top,
    left: firstScreenshot.offset.left,
  };
  const secondImageCropRect: ElementRect = {
    height: size.height,
    width: size.width,
    bottom: secondScreenshot.offset.top + size.height,
    right: secondScreenshot.offset.left + size.width,
    top: secondScreenshot.offset.top,
    left: secondScreenshot.offset.left,
  };
  const firstMask = round(realize(firstImageCropRect, firstScreenshot.pixelRatio || 1));
  const secondMask = round(realize(secondImageCropRect, secondScreenshot.pixelRatio || 1));
  const firstImage = safeCropImage(firstScreenshot.image, firstMask);
  const secondImage = safeCropImage(secondScreenshot.image, secondMask);
  const { diffImage, diffPixels } = compareImages(
    firstImage,
    secondImage,
    scaleSize(size, firstScreenshot.pixelRatio || 1)
  );
  const [firstPacked, secondPacked, diffPacked] = await Promise.all([
    packPng(firstImage),
    packPng(secondImage),
    diffImage && packPng(diffImage),
  ]);
  return {
    firstImage: firstPacked,
    secondImage: secondPacked,
    diffImage: diffPacked,
    isEqual: diffPixels <= 1,
    diffPixels,
  };
}
