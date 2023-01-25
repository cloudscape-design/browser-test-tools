// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import sharp from 'sharp';

const PNG_CHANNELS = 4; // RGBA

export async function mergeImages(
  pngImages: Array<Buffer>,
  width: number,
  height: number,
  lastImageOffset: number,
  offsetTop: number
): Promise<string> {
  const combinedHeight = offsetTop + height * pngImages.length;
  const canvas = Buffer.alloc(width * combinedHeight * PNG_CHANNELS);
  return (
    sharp(canvas, { raw: { width, height: combinedHeight, channels: PNG_CHANNELS } })
      .composite(
        pngImages.map((input, i) => ({
          input,
          top: offsetTop + height * i - (i === pngImages.length - 1 ? lastImageOffset : 0),
          left: 0,
        }))
      )
      .toFormat('png')
      .toBuffer()
      // Compositing and crop need to happen in separate pipelines
      .then(buf =>
        sharp(buf)
          .extract({ left: 0, top: 0, width: width, height: combinedHeight - lastImageOffset })
          .toBuffer()
      )
      .then(buf => buf.toString('base64'))
  );
}
