// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { packPng, cropImage, parsePng } from './utils';
import { ElementRect, ElementSize, Screenshot } from '../page-objects/types';

export function compareImages(firstImage: PNG, secondImage: PNG, { width, height }: ElementSize) {
  // This prevents an error thrown from pixelmatch when comparing 0-sized images.
  if (width === 0 || height === 0) {
    return { diffPixels: -1, diffImage: null };
  }
  // fast path when two image files are identical
  if (firstImage.data.equals(secondImage.data)) {
    return { diffPixels: 0, diffImage: null };
  }
  const diffImage = new PNG({ width, height });
  const diffPixels = pixelmatch(firstImage.data, secondImage.data, diffImage.data, width, height, { threshold: 0.01 });
  return { diffPixels, diffImage };
}

function normalizeSize(firstScreenshot: Screenshot, secondScreenshot: Screenshot) {
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
  firstScreenshot: Screenshot,
  secondScreenshot: Screenshot
): Promise<CropAndCompareResult> {
  // Fast path: if rawBase64 is present on both, identical, and no cropping needed,
  // skip all decoding entirely.
  if (
    firstScreenshot.rawBase64 &&
    secondScreenshot.rawBase64 &&
    firstScreenshot.rawBase64 === secondScreenshot.rawBase64 &&
    !firstScreenshot.offset &&
    !secondScreenshot.offset
  ) {
    const buffer = Buffer.from(firstScreenshot.rawBase64, 'base64');
    return { firstImage: buffer, secondImage: buffer, diffImage: null, isEqual: true, diffPixels: 0 };
  }

  const pixelRatio = firstScreenshot.pixelRatio || 1;
  const size = normalizeSize(firstScreenshot, secondScreenshot);
  const scaledSize = scaleSize(size, pixelRatio);

  const firstNeedsCrop = !!firstScreenshot.offset;
  const secondNeedsCrop = !!secondScreenshot.offset;

  // Decode images on demand: use pre-decoded image if available, otherwise parse from rawBase64
  const firstDecoded = firstScreenshot.image ?? (await parsePng(firstScreenshot.rawBase64));
  const secondDecoded = secondScreenshot.image ?? (await parsePng(secondScreenshot.rawBase64));

  const firstImage = firstNeedsCrop
    ? cropImage(firstDecoded, buildCropRect(firstScreenshot, size), pixelRatio)
    : firstDecoded;
  const secondImage = secondNeedsCrop
    ? cropImage(secondDecoded, buildCropRect(secondScreenshot, size), pixelRatio)
    : secondDecoded;

  const { diffImage, diffPixels } = compareImages(firstImage, secondImage, scaledSize);

  // Skip packPng when no cropping was needed and rawBase64 is available
  const [firstPacked, secondPacked, diffPacked] = await Promise.all([
    !firstNeedsCrop && firstScreenshot.rawBase64
      ? Buffer.from(firstScreenshot.rawBase64, 'base64')
      : packPng(firstImage),
    !secondNeedsCrop && secondScreenshot.rawBase64
      ? Buffer.from(secondScreenshot.rawBase64, 'base64')
      : packPng(secondImage),
    diffImage && packPng(diffImage),
  ]);

  return {
    firstImage: firstPacked,
    secondImage: secondPacked,
    diffImage: diffPacked,
    isEqual: diffPixels >= 0 && diffPixels <= 1,
    diffPixels,
  };
}

function buildCropRect(screenshot: Screenshot, size: ElementSize): ElementRect {
  const top = screenshot.offset?.top ?? 0;
  const left = screenshot.offset?.left ?? 0;
  return {
    height: size.height,
    width: size.width,
    bottom: top + size.height,
    right: left + size.width,
    top,
    left,
  };
}
