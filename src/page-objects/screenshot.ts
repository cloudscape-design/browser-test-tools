// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getPermutationSizes, PermutationInfo } from '../browser-scripts';
import { parsePng } from '../image-utils';
import { ElementOffset, ScreenshotCapturingOptions, ScreenshotWithOffset } from './types';
import ScreenshotBasePageObject from './screenshot-base';

export interface PermutationScreenshot extends ScreenshotWithOffset {
  id: string;
}

export default class ScreenshotPageObject extends ScreenshotBasePageObject {
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
}
