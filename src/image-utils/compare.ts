// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { packPng, cropImage, parsePng } from './utils';
import { ElementRect, ElementSize, Screenshot, ScreenshotWithOffset } from '../page-objects/types';

interface Size {
  width: number;
  height: number;
}

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

function normalizeSize(firstScreenshot: Screenshot, secondScreenshot: Screenshot): Size {
  return {
    height: Math.round(Math.max(firstScreenshot.height, secondScreenshot.height)),
    width: Math.round(Math.max(firstScreenshot.width, secondScreenshot.width)),
  };
}

function isScreenshotWithOffset(s: Screenshot): s is ScreenshotWithOffset {
  return 'offset' in s && s.offset !== undefined;
}

function scaleSize(size: ElementSize, pixelRatio: number): Size {
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

async function getScreenshotImage(screenshot: Screenshot): Promise<PNG> {
  if (isScreenshotWithOffset(screenshot)) {
    return screenshot.image;
  }
  // Cache the parsed image in the screenshot object so that it does not need to be parsed anymore
  // when cropping it again for a different offset
  screenshot.image = screenshot.image || (await parsePng(screenshot.rawBase64));
  return screenshot.image;
}

async function cropIfNeeded(screenshot: Screenshot, size: Size) {
  const image = await getScreenshotImage(screenshot);
  if (isScreenshotWithOffset(screenshot)) {
    return cropImage(image, buildCropRect(screenshot as ScreenshotWithOffset, size), screenshot.pixelRatio);
  } else {
    return image;
  }
}

export async function cropAndCompare(
  firstScreenshot: Screenshot,
  secondScreenshot: Screenshot
): Promise<CropAndCompareResult> {
  // Fast path: if rawBase64 is present on both, identical, and no cropping needed, skip all decoding entirely.
  if (
    !isScreenshotWithOffset(firstScreenshot) &&
    !isScreenshotWithOffset(secondScreenshot) &&
    firstScreenshot.rawBase64 === secondScreenshot.rawBase64
  ) {
    const buffer = Buffer.from(firstScreenshot.rawBase64, 'base64');
    return { firstImage: buffer, secondImage: buffer, diffImage: null, isEqual: true, diffPixels: 0 };
  }

  const pixelRatio = firstScreenshot.pixelRatio || 1;

  const size = normalizeSize(firstScreenshot, secondScreenshot);
  const scaledSize = scaleSize(size, pixelRatio);

  const firstImage = await cropIfNeeded(firstScreenshot, size);
  const secondImage = await cropIfNeeded(secondScreenshot, size);

  const { diffImage, diffPixels } = compareImages(firstImage, secondImage, scaledSize);

  // Skip packPng when no cropping was needed and rawBase64 is available
  const [firstPacked, secondPacked, diffPacked] = await Promise.all([
    !isScreenshotWithOffset(firstScreenshot) ? Buffer.from(firstScreenshot.rawBase64, 'base64') : packPng(firstImage),
    !isScreenshotWithOffset(secondScreenshot)
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

function buildCropRect(screenshot: ScreenshotWithOffset, size: ElementSize): ElementRect {
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
