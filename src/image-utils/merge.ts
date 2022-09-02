// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';

/**
 * Merges the passed images vertically into a single output image.
 * @param pngs to be merged
 * @returns single image
 */
export default async function merge(pngs: PNG[]) {
  const maxWidth = pngs.reduce((max, curr) => (curr.width > max ? curr.width : max), 0);
  const totalHeight = pngs.reduce((sum, curr) => sum + curr.height, 0);
  const out = new PNG({ width: maxWidth, height: totalHeight });

  let i = 0;
  let offset = 0;
  while (i < pngs.length) {
    const png = pngs[i];
    png.bitblt(out, 0, 0, png.width, png.height, 0, offset);
    offset += png.height;
    i++;
  }

  return out;
}
