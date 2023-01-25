// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { ElementRect, ElementSize, ScreenshotWithOffset } from '../page-objects/types';
import { cropByRect } from './crop';

export async function compareImages(firstImage: Buffer, secondImage: Buffer, { width, height }: ElementSize) {
  // fast path when two image files are identical
  if (firstImage.equals(secondImage)) {
    return { diffPixels: 0, diffImage: null };
  }
  const firstImageMetadata = await sharp(firstImage).metadata();
  const firstImagePixels = await sharp(firstImage).toFormat('raw').toBuffer();
  const secondImagePixels = await sharp(secondImage).toFormat('raw').toBuffer();
  const diffImagePixels = Buffer.alloc(firstImagePixels.length);
  const diffPixelCount = pixelmatch(firstImagePixels, secondImagePixels, diffImagePixels, width, height, {
    threshold: 0.01,
  });
  const diffImage = await sharp(diffImagePixels, {
    raw: {
      width: firstImageMetadata.width!,
      height: firstImageMetadata.height!,
      channels: firstImageMetadata.channels!,
    },
  })
    .toFormat('png')
    .toBuffer();
  return { diffPixels: diffPixelCount, diffImage: diffImage };
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
  const pixelRatio = firstScreenshot.pixelRatio || 1;
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

  const firstImage = await cropByRect(firstScreenshot.image, firstImageCropRect, pixelRatio);
  const secondImage = await cropByRect(secondScreenshot.image, secondImageCropRect, pixelRatio);
  const { diffImage, diffPixels } = await compareImages(firstImage, secondImage, scaleSize(size, pixelRatio));
  return { firstImage, secondImage, diffImage, diffPixels, isEqual: diffPixels <= 1 };
}
