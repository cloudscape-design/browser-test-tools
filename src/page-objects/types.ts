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
}

export interface Screenshot extends ElementSize {
  image?: PNG;
  pixelRatio?: number;
  /**
   * The raw base64-encoded PNG from WebDriver, retained for fast byte-equality
   * comparison in cropAndCompare. When two screenshots have the same rawBase64
   * and no cropping is needed, expensive decoding is skipped entirely.
   */
  rawBase64: string;
  offset?: ElementOffset;
}

export interface ScreenshotWithOffset extends Screenshot {
  offset: ElementOffset;
}
