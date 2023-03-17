// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const fs = require('fs');
const path = require('path');
const mergeImages = require('../src/image-utils/merge').default;
const { parsePng } = require('../src/image-utils');

test('merges into single image with new dimensions', async () => {
  const image1Data = fs.readFileSync(path.join(__dirname, './fixtures/blue.png')).toString('base64');
  const image2Data = fs.readFileSync(path.join(__dirname, './fixtures/red.png')).toString('base64');
  const image1 = await parsePng(image1Data);
  const image2 = await parsePng(image2Data);

  const actual = await mergeImages([image1, image2]);

  expect(actual.height).toBe(image1.height + image2.height);
  expect(actual.width).toBe(Math.max(image1.width, image2.width));
});
