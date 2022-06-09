// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
/**
 * Combines a list of images vertically. It will have the width of the widest image
 * and the total height of all.
 * @param pngs images to be merged together
 * @returns merged image
 */
export default function merge(pngs: PNG[]) {
  const totalHeight = pngs.reduce((acc, curr) => acc + curr.height, 0);
  const maxWidth = pngs.reduce((acc, curr) => Math.max(acc, curr.width), 0);

  const out = new PNG({ width: maxWidth, height: totalHeight });

  let mergeOffset = 0;
  pngs.forEach(png => {
    png.bitblt(out, 0, 0, png.width, png.height, 0, mergeOffset);
    mergeOffset += png.height;
  });

  return out;
}
