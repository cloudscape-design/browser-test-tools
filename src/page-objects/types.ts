// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface ElementSize {
  width: number;
  height: number;
}

export interface ElementOffset {
  top: number;
  left: number;
}

export interface ElementRect extends ElementOffset, ElementSize {
  bottom: number;
  right: number;
}

export interface ViewportSize extends ElementOffset, ElementSize {
  pageHeight: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

export interface ScreenshotCapturingOptions {
  viewportOnly?: boolean;
}

export interface ScreenshotWithOffset extends ElementSize {
  image: Buffer;
  offset: ElementOffset;
  pixelRatio?: number;
}
