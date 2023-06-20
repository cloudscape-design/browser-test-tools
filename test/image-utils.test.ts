// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';

import { describe, test, expect } from 'vitest';

import mergeImages from '../src/image-utils/merge';
import { parsePng } from '../src/image-utils';

describe('mergeImages', () => {
  test('should not merge images beyond their dimensions', async () => {
    const image1Data = fs.readFileSync(path.join(__dirname, './fixtures/blue.png')).toString('base64');
    const image2Data = fs.readFileSync(path.join(__dirname, './fixtures/red.png')).toString('base64');

    const image1 = await parsePng(image1Data);

    const result = await mergeImages([image1Data, image2Data], image1.width + 100, image1.height, 0, 0);
    const resultImage = await parsePng(result);

    expect(resultImage).not.toBeFalsy();
    expect(resultImage.width).toBe(image1.width + 100);
    expect(resultImage.height).toBe(image1.height * 2);
  });

  test('can "merge" a single image', async () => {
    const imageData = fs.readFileSync(path.join(__dirname, './fixtures/blue.png')).toString('base64');
    const image = await parsePng(imageData);

    const lastImageOffset = 20;
    const result = await mergeImages([imageData], image.width, image.height, lastImageOffset, 0);
    const resultImage = await parsePng(result);

    expect(resultImage).not.toBeFalsy();
    expect(resultImage.width).toBe(image.width);
    expect(resultImage.height).toBe(image.height - lastImageOffset);
  });
});
