// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  ScrollAction,
  scrollAction,
  getPermutationSizes,
  getPageDimensions,
  PermutationInfo,
} from '../browser-scripts';
import { parsePng } from '../image-utils';
import BasePageObject from './base';
import { ElementOffset, Screenshot, ScreenshotCapturingOptions } from './types';
import fullPageScreenshot from './full-page-screenshot';

export interface PermutationScreenshot extends Screenshot {
  /** Identifier from the data-permutation attribute */
  id: string;
}

export default class ScreenshotPageObject extends BasePageObject {
  constructor(browser: WebdriverIO.Browser, public readonly forceScrollAndMerge: boolean = false) {
    super(browser);
  }

  async focusNextElement() {
    return this.keys('Tab');
  }

  async scrollToBottom(selector: string) {
    const action: ScrollAction = 'scrollToBottom';
    await this.browser.execute(scrollAction, { action, selector });
  }

  async scrollToRight(selector: string) {
    const action: ScrollAction = 'scrollToRight';
    await this.browser.execute(scrollAction, { action, selector });
  }

  async fullPageScreenshot() {
    // preserve scroll position in order to avoid side effects after screenshot taking
    const scrollPosition = await this.getWindowScroll();
    // Wait for the page to settle before taking a screenshot
    await this.waitForJsTimers();
    const screenshot = await fullPageScreenshot(this.browser, this.forceScrollAndMerge);
    // restore scroll position
    await this.windowScrollTo(scrollPosition);
    return screenshot;
  }

  async captureBySelector(selector: string, options: ScreenshotCapturingOptions = {}): Promise<Screenshot> {
    await this.waitForVisible(selector);
    const { pixelRatio } = await this.getViewportSize();
    const box = await this.getBoundingBox(selector);

    try {
      const element = this.browser.$(selector);
      const rawBase64 = await this.browser.takeElementScreenshot(await element.elementId);
      return { rawBase64, pixelRatio, height: box.height, width: box.width };
    } catch {
      console.warn('Could not use takeElementScreenshot. Falling back to full-page screenshot and cropping');
      const { top, left } = await this.getViewportSize();
      const rawBase64 = options.viewportOnly ? await this.browser.takeScreenshot() : await this.fullPageScreenshot();
      const image = await parsePng(rawBase64);

      const offset: ElementOffset = { top: box.top, left: box.left };
      if (!options.viewportOnly) {
        offset.top += top;
        offset.left += left;
      }

      return { image, offset, pixelRatio, height: box.height, width: box.width, rawBase64 };
    }
  }

  async captureViewport(): Promise<Screenshot> {
    const { height, width } = await this.getViewportSize();
    const rawBase64 = await this.browser.takeScreenshot();
    return { height, width, rawBase64 };
  }

  /**
   * Captures all permutation elements. Uses takeElementScreenshot when available
   * to return pre-cropped PNGs without decoding. Falls back to a single full-page
   * screenshot with bounding box metadata if takeElementScreenshot is unavailable.
   *
   * Consumers can compare rawBase64 directly for fast byte-equality checks and
   * only call parsePng(rawBase64) when a diff is needed.
   */
  async capturePermutations(options?: { individualScreenshots?: boolean }): Promise<PermutationScreenshot[]> {
    await this.windowScrollTo({ top: 0, left: 0 });

    // Adapt viewport height to fit all elements before taking screenshots
    const originalWindowSize = await this.fitWindowHeightToContent();

    const results = this.takePermutationScreenshots(options?.individualScreenshots);

    // Restore window size after taking the screenshot
    await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);

    return results;
  }

  private async takePermutationScreenshots(individualScreenshots = false): Promise<PermutationScreenshot[]> {
    const elements = this.browser.$$('[data-permutation]');
    if ((await elements.length) === 0) {
      throw new Error('No permutations found on current page.');
    }
    if (individualScreenshots) {
      try {
        // Try to capture each element individually via takeElementScreenshot.
        // Each screenshot is already cropped to the element — no need to decode, crop and re-encode to PNG.
        const results: PermutationScreenshot[] = [];
        const pixelRatio = await this.browser.execute(function () {
          return window.devicePixelRatio || 1;
        });
        for (const element of elements) {
          const id = (await element.getAttribute('data-permutation')) || '';
          const rawBase64 = await this.browser.takeElementScreenshot(element.elementId);
          const size = await element.getSize();
          results.push({
            id,
            rawBase64,
            width: size.width * pixelRatio,
            height: size.height * pixelRatio,
          });
        }
        return results;
      } catch {
        console.warn('Could not use takeElementScreenshot. Falling back to full-page screenshot and cropping');
        return this.takePermutationScreenshots();
      }
    } else {
      // Single full-page screenshot with bounding box metadata for cropping

      const screenshot = await this.fullPageScreenshot();
      const permutations = await this.browser.execute(getPermutationSizes);

      return permutations.map((permutation: PermutationInfo) => ({
        id: permutation.id,
        rawBase64: screenshot,
        offset: permutation.offset,
        width: permutation.width,
        height: permutation.height,
      }));
    }
  }

  private async fitWindowHeightToContent(): Promise<{ width: number; height: number }> {
    const originalWindowSize = await this.browser.getWindowSize();
    const { viewportHeight, pageHeight } = await this.browser.execute(getPageDimensions);
    const windowUIHeight = originalWindowSize.height - viewportHeight;
    await this.safeSetWindowSize(originalWindowSize.width, pageHeight + windowUIHeight);
    return originalWindowSize;
  }

  /* istanbul ignore next -- setWindowSize is unsupported on some mobile browsers, not testable in CI */
  private async safeSetWindowSize(width: number, height: number): Promise<void> {
    try {
      await this.browser.setWindowSize(width, height);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Method has not yet been implemented')) {
        console.log('setWindowSize is not supported on this device');
      } else {
        throw error;
      }
    }
  }
}
