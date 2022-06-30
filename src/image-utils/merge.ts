// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import { parsePng, packPng } from './utils';

export default async function mergeImages(
  images: string[],
  width: number,
  height: number,
  lastImageOffset: number,
  offsetTop: number
) {
  const outImage = new PNG({ width, height: height * images.length - lastImageOffset });

  if (images.length === 1) {
    const png = await parsePng(images[0]);
    png.bitblt(outImage, 0, offsetTop, width, height - lastImageOffset, 0, 0);
  } else {
    for (let index = 0; index < images.length; index++) {
      const png = await parsePng(images[index]);
      const verticalOffset = index < images.length - 1 ? index * height : index * height - lastImageOffset;
      png.bitblt(outImage, 0, offsetTop, Math.min(width, png.width), Math.min(height, png.height), 0, verticalOffset);
    }
  }

  const encoded = await packPng(outImage);
  return encoded.toString('base64');
}
