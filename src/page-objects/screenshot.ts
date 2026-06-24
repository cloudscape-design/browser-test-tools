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
import { ElementOffset, RawScreenshot, ScreenshotWithOffset, ScreenshotCapturingOptions } from './types';
import fullPageScreenshot from './full-page-screenshot';
import { Browser } from 'webdriverio';

/** Permutation screenshot from takeElementScreenshot — no image, no offset. */
export interface RawPermutationScreenshot extends RawScreenshot {
  id: string;
}

/** Permutation screenshot from full-page fallback — has image and offset for cropping. */
export interface PermutationScreenshot extends ScreenshotWithOffset {
  id: string;
}

export default class ScreenshotPageObject extends BasePageObject {
  constructor(browser: Browser, public readonly forceScrollAndMerge: boolean = false) {
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

  // Overloads for captureBySelector
  async captureBySelector(
    selector: string,
    options: ScreenshotCapturingOptions & { singleElements: true }
  ): Promise<RawScreenshot>;
  async captureBySelector(
    selector: string,
    options?: ScreenshotCapturingOptions & { singleElements?: false }
  ): Promise<ScreenshotWithOffset>;
  async captureBySelector(
    selector: string,
    options: ScreenshotCapturingOptions = {}
  ): Promise<RawScreenshot | ScreenshotWithOffset> {
    await this.waitForVisible(selector);
    const { pixelRatio } = await this.getViewportSize();
    const box = await this.getBoundingBox(selector);

    if (options.singleElements) {
      const originalWindowSize = await this.fitWindowHeightToContent();
      const element = this.browser.$(selector);
      const rawBase64 = await this.browser.takeElementScreenshot(await element.elementId);
      await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);
      return { rawBase64, pixelRatio, height: box.height, width: box.width };
    }

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

  async captureViewport(options: { singleElements: true }): Promise<RawScreenshot>;
  async captureViewport(options?: { singleElements?: false }): Promise<ScreenshotWithOffset>;
  async captureViewport(options?: { singleElements?: boolean }): Promise<RawScreenshot | ScreenshotWithOffset> {
    const { height, width } = await this.getViewportSize();
    const rawBase64 = await this.browser.takeScreenshot();

    if (options?.singleElements) {
      return { rawBase64, height, width };
    }

    const image = await parsePng(rawBase64);
    return { image, offset: { top: 0, left: 0 }, height, width };
  }

  // Overloads for capturePermutations
  async capturePermutations(options: { singleElements: true }): Promise<RawPermutationScreenshot[]>;
  async capturePermutations(options?: { singleElements?: false }): Promise<PermutationScreenshot[]>;
  async capturePermutations(options?: {
    singleElements?: boolean;
  }): Promise<RawPermutationScreenshot[] | PermutationScreenshot[]> {
    await this.windowScrollTo({ top: 0, left: 0 });

    // Adapt viewport height to fit all elements before taking screenshots
    const originalWindowSize = await this.fitWindowHeightToContent();

    try {
      const results = await this.takePermutationScreenshots(options);
      await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);
      return results;
    } catch (error) {
      await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);
      throw error;
    }
  }

  private async takePermutationScreenshots(options?: {
    singleElements?: boolean;
  }): Promise<PermutationScreenshot[] | RawPermutationScreenshot[]> {
    if (options?.singleElements) {
      const elements = this.browser.$$('[data-permutation]');
      if ((await elements.length) === 0) {
        throw new Error('No permutations found on current page.');
      }

      const pixelRatio = await this.browser.execute(function () {
        return window.devicePixelRatio || 1;
      });
      const results: RawPermutationScreenshot[] = [];
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
    } else {
      const rawBase64 = await this.fullPageScreenshot();
      const image = await parsePng(rawBase64);
      const permutations = await this.browser.execute(getPermutationSizes);

      if (permutations.length === 0) {
        throw new Error('No permutations found on current page.');
      }

      return permutations.map((permutation: PermutationInfo) => ({
        id: permutation.id,
        image,
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
