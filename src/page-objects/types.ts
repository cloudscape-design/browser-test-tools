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

export interface ScreenshotWithOffset extends ElementSize {
  image: PNG;
  offset: ElementOffset;
  pixelRatio?: number;
  /** Optional raw base64 PNG for fast byte-equality comparison. */
  rawBase64?: string;
}

/**
 * A raw screenshot with base64 data and dimensions. No decoded image, no offset.
 * Returned by RawScreenshotPageObject which uses takeElementScreenshot.
 */
export interface RawScreenshot extends ElementSize {
  rawBase64: string;
  pixelRatio?: number;
}
