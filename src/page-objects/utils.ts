// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ElementRect } from './types';

export function getElementCenter(rect: ElementRect): { x: number; y: number } {
  return {
    x: Math.floor(rect.left + rect.width / 2),
    y: Math.floor(rect.top + rect.height / 2),
  };
}

// This is the pixel values *before* applying the device pixel ratio
const iosStatusBar = 47;
const iosTabBar = 133;

interface Dimensions {
  width: number;
  height: number;
}

export function getIosDeviceMask(image: Dimensions): ElementRect {
  return {
    top: iosStatusBar,
    left: 0,
    right: 0,
    bottom: iosTabBar,
    width: image.width,
    height: image.height - iosStatusBar - iosTabBar,
  };
}
