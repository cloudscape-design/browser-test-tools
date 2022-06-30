// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { scrollToBottom, scrollToRight } from '../browser-scripts';
import { parsePng } from '../image-utils';
import BasePageObject from './base';
import { ElementOffset, ScreenshotCapturingOptions, ScreenshotWithOffset } from './types';
import fullPageScreenshot from './full-page-screenshot';

export default class ScreenshotPageObject extends BasePageObject {
  async focusNextElement() {
    return this.keys('Tab');
  }

  async scrollToBottom(selector: string) {
    await this.browser.execute(scrollToBottom, selector);
  }

  async scrollToRight(selector: string) {
    await this.browser.execute(scrollToRight, selector);
  }

  async fullPageScreenshot() {
    // preserve scroll position in order to avoid side effects after screenshot taking
    const scrollPosition = await this.getWindowScroll();
    // Wait for the page to settle before taking a screenshot
    await this.waitForJsTimers();
    const screenshot = await fullPageScreenshot(this.browser);
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
}
