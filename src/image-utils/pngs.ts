// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import { promisify } from 'util';
import getStream from 'get-stream';

export async function parsePng(encodedImage: string) {
  const png = new PNG();
  await promisify(png.parse.bind(png))(Buffer.from(encodedImage, 'base64'));
  return png;
}

export function packPng(png: PNG) {
  return getStream.buffer(png.pack());
}
