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
import { ElementOffset, ScreenshotCapturingOptions, ScreenshotWithOffset } from './types';
import fullPageScreenshot from './full-page-screenshot';

export interface PermutationScreenshot extends ScreenshotWithOffset {
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

  async captureBySelector(selector: string, options: ScreenshotCapturingOptions = {}): Promise<ScreenshotWithOffset> {
    await this.waitForVisible(selector);
    const { pixelRatio, top, left } = await this.getViewportSize();
    const box = await this.getBoundingBox(selector);
    const screenshot = options.viewportOnly ? await this.browser.takeScreenshot() : await this.fullPageScreenshot();
    const image = await parsePng(screenshot);

    const offset: ElementOffset = { top: box.top, left: box.left };
    if (!options.viewportOnly) {
      // Correct potential scrolling offsets when using a full page screenshot
      offset.top += top;
      offset.left += left;
    }

    return { image, offset, pixelRatio, height: box.height, width: box.width };
  }

  async captureViewport(): Promise<ScreenshotWithOffset> {
    const { height, width } = await this.getViewportSize();

    const offset: ElementOffset = {
      top: 0,
      left: 0,
    };

    const screenshot = await this.browser.takeScreenshot();
    const image = await parsePng(screenshot);
    return { image, offset, height, width };
  }

  async capturePermutations(): Promise<PermutationScreenshot[]> {
    await this.windowScrollTo({ top: 0, left: 0 });

    // Adapt viewport height to fit all elements before taking a screenshot
    const originalWindowSize = await this.fitWindowHeightToContent();

    const screenshot = await this.fullPageScreenshot();
    const image = await parsePng(screenshot);
    const permutations = await this.browser.execute(getPermutationSizes);

    // Restore window size after taking the screenshot
    await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);

    if (permutations.length === 0) {
      throw new Error('No permutations found on current page.');
    }

    return permutations.map((permutation: PermutationInfo) => ({ ...permutation, image }));
  }

  private async fitWindowHeightToContent(): Promise<{ width: number; height: number }> {
    const originalWindowSize = await this.browser.getWindowSize();
    const { viewportHeight, pageHeight } = await this.browser.execute(getPageDimensions);
    const windowUIHeight = originalWindowSize.height - viewportHeight;
    await this.safeSetWindowSize(originalWindowSize.width, pageHeight + windowUIHeight);
    return originalWindowSize;
  }

  private async safeSetWindowSize(width: number, height: number): Promise<void> {
    try {
      await this.browser.setWindowSize(width, height);
    } catch (error) {
      // setWindowSize is unsupported on some mobile browsers, not testable in CI
      /* istanbul ignore next */ if (
        !(error instanceof Error && error.message.includes('Method has not yet been implemented'))
      ) {
        throw error;
      }
    }
  }
}
