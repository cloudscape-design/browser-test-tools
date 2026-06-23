// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PNG } from 'pngjs';

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
  singleElements?: boolean;
}

/**
 * A raw screenshot with base64 data and dimensions. No decoded image, no offset.
 * Returned when singleElements is true (takeElementScreenshot was used).
 */
export interface RawScreenshot extends ElementSize {
  image?: PNG;
  rawBase64: string;
  pixelRatio?: number;
}

/**
 * A decoded screenshot with image data, offset for cropping, and optional rawBase64.
 * Returned when singleElements is false/absent (full-page screenshot path).
 */
export interface ScreenshotWithOffset extends RawScreenshot {
  image: PNG;
  offset: ElementOffset;
}

/** Union of both screenshot types. */
export type Screenshot = RawScreenshot | ScreenshotWithOffset;
