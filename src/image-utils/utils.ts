// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import { promisify } from 'util';
import getStream from 'get-stream';
import { ScreenshotTakeError } from '../exceptions';
import { ElementRect } from '../page-objects/types';

function roundDimensions(rect: ElementRect) {
  const result: Partial<ElementRect> = {};
  (Object.keys(rect) as Array<keyof ElementRect>).forEach(key => {
    result[key] = Math.round(rect[key]);
  });
  return result as ElementRect;
}

export async function parsePng(encodedImage: string) {
  const png = new PNG();
  await promisify(png.parse.bind(png))(Buffer.from(encodedImage, 'base64'));
  return png;
}

export function packPng(png: PNG) {
  return getStream.buffer(png.pack());
}

export function isValidImage(pixels: Buffer) {
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

export function cropImage(inImage: PNG, rect: ElementRect, pixelRatio = 1) {
  const roundedRect = roundDimensions(rect);
  const imageWidth = Math.ceil(roundedRect.width * pixelRatio || inImage.width);
  const imageHeight = Math.ceil(roundedRect.height * pixelRatio || inImage.height);

  const outImage = new PNG({ width: imageWidth, height: imageHeight });

  const safeLeft = Math.max(roundedRect.left, 0) * pixelRatio;
  const safeTop = Math.max(roundedRect.top, 0) * pixelRatio;

  const safeWidth = Math.min(imageWidth, inImage.width - safeLeft);
  const safeHeight = Math.min(imageHeight, inImage.height - safeTop);
  inImage.bitblt(outImage, safeLeft, safeTop, safeWidth, safeHeight, 0, 0);
  // if (!isValidImage(outImage.data)) {
  //   throw new ScreenshotTakeError('Image does not contain enough colors');
  // }
  return outImage;
}
