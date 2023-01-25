// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const { mergeImages } = require('../src/image-utils/merge');

describe('mergeImages', () => {
  test('should not merge images beyond their dimensions', async () => {
    const firstImage = fs.readFileSync(path.join(__dirname, './fixtures/blue.png'));
    const secondImage = fs.readFileSync(path.join(__dirname, './fixtures/red.png'));

    const firstMetadata = await sharp(firstImage).metadata();
    const resultImage = await mergeImages(
      [firstImage, secondImage],
      firstMetadata.width + 100,
      firstMetadata.height,
      0,
      0
    );
    const resultMetadata = await sharp(Buffer.from(resultImage, 'base64')).metadata();

    expect(resultMetadata.width).toBe(firstMetadata.width + 100);
    expect(resultMetadata.height).toBe(firstMetadata.height * 2);
  });

  test('can "merge" a single image', async () => {
    const image = fs.readFileSync(path.join(__dirname, './fixtures/blue.png'));
    const metadata = await sharp(image).metadata();

    const lastImageOffset = 20;
    const resultImage = await mergeImages([image], metadata.width, metadata.height, lastImageOffset, 0);
    const resultMetadata = await sharp(Buffer.from(resultImage, 'base64')).metadata();

    expect(resultMetadata.width).toBe(metadata.width);
    expect(resultMetadata.height).toBe(metadata.height - lastImageOffset);
  });
});
