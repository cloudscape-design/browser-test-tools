// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import sharp from 'sharp';
import { ScreenshotTakeError } from '../exceptions';
import { ElementOffset, ElementRect } from '../page-objects/types';

function roundDimensions(rect: ElementRect) {
  const result: Partial<ElementRect> = {};
  (Object.keys(rect) as Array<keyof ElementRect>).forEach(key => {
    result[key] = Math.round(rect[key as keyof ElementRect]);
  });
  return result as ElementRect;
}

async function isValidImage(pngImage: Buffer) {
  const pixels = await sharp(pngImage).toFormat('raw').toBuffer();
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

export async function cropByRect(pngImage: Buffer, rect: ElementRect, pixelRatio = 1): Promise<Buffer> {
  let image = sharp(pngImage);
  const metadata = await image.metadata();

  const roundedRect = roundDimensions(rect);
  const imageWidth = Math.ceil(roundedRect.width * pixelRatio || metadata.width!);
  const imageHeight = Math.ceil(roundedRect.height * pixelRatio || metadata.height!);

  const safeLeft = Math.max(roundedRect.left, 0) * pixelRatio;
  const safeTop = Math.max(roundedRect.top, 0) * pixelRatio;
  const safeWidth = Math.min(imageWidth, metadata.width! - safeLeft);
  const safeHeight = Math.min(imageHeight, metadata.height! - safeTop);

  image = image.extract({ top: safeTop, left: safeLeft, width: safeWidth, height: safeHeight });
  if (safeWidth < imageWidth || safeHeight < imageHeight) {
    // Pad the image to bring it back to original dimensions
    image = image.extend({ right: imageWidth - safeWidth, bottom: imageHeight - safeHeight, background: '#ffffff' });
  }

  const croppedImage = await image.toBuffer();
  const hasEnoughColors = await isValidImage(croppedImage);
  if (!hasEnoughColors) {
    throw new ScreenshotTakeError('Image does not contain enough colors');
  }
  return croppedImage;
}

export async function cropByOffset(pngImage: Buffer, offset: ElementOffset) {
  const image = sharp(pngImage);
  const metadata = await image.metadata();

  const rect: ElementRect = {
    top: offset.top,
    left: offset.left,
    bottom: metadata.height!,
    right: metadata.width!,
    height: metadata.height! - offset.top,
    width: metadata.width! - offset.left,
  };

  // PERF: cropByRect also calls .metadata(); could be improved later
  return cropByRect(pngImage, rect);
}
