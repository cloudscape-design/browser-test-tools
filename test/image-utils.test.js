// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const fs = require('fs');
const path = require('path');
const merge = require('../src/image-utils/merge').default;
const { parsePng } = require('../src/image-utils');

describe('merge', () => {
  let images;

  beforeAll(async () => {
    const strings = [
      fs.readFileSync(path.join(__dirname, './fixtures/blue.png')).toString('base64'),
      fs.readFileSync(path.join(__dirname, './fixtures/red.png')).toString('base64'),
    ];
    images = await Promise.all(strings.map(string => parsePng(string)));
  });

  test('retains dimensions for single image', async () => {
    const image = images[0];
    const actual = merge([image]);

    expect(actual.width).toEqual(image.width);
    expect(actual.height).toEqual(image.height);
  });

  test('concatenates images into one column with same width and summed height', async () => {
    const [a, b] = images;
    const actual = merge(images);

    expect(actual.width).toEqual(Math.max(a.width, b.width));
    expect(actual.height).toEqual(a.height + b.height);
  });
});
