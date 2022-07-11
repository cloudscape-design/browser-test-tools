// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';
import { cropImage, packPng } from './utils';
import { ElementOffset, ElementRect } from '../page-objects/types';

export async function cropByOffset(encodedImage: PNG, offset: ElementOffset) {
  const rect: ElementRect = {
    top: offset.top,
    left: offset.left,
    bottom: encodedImage.height,
    right: encodedImage.width,
    height: encodedImage.height - offset.top,
    width: encodedImage.width - offset.left,
  };

  return cropByRect(encodedImage, rect);
}

export async function cropByRect(encodedImage: PNG, rect: ElementRect) {
  const image = await cropImage(encodedImage, rect);
  return packPng(image);
}
