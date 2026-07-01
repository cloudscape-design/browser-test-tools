// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import ScreenshotBasePageObject from './screenshot-base';
import { RawScreenshot } from './types';

/**
 * Raw permutation screenshot captured via takeElementScreenshot.
 * No decoded image, no offset — just the raw base64 PNG per element.
 */
export interface RawPermutationScreenshot extends RawScreenshot {
  id: string;
}

/**
 * A page object that captures screenshots using takeElementScreenshot.
 * Returns raw base64 PNGs without decoding, cropping, or re-encoding —
 * significantly faster when pixel-level comparison can be done on raw bytes.
 */
export default class RawScreenshotPageObject extends ScreenshotBasePageObject {
  async captureBySelector(selector: string): Promise<RawScreenshot> {
    await this.waitForVisible(selector);
    const { pixelRatio } = await this.getViewportSize();
    const box = await this.getBoundingBox(selector);

    const originalWindowSize = await this.fitWindowHeightToContent();
    const element = this.browser.$(selector);
    const rawBase64 = await this.browser.takeElementScreenshot(await element.elementId);
    await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);

    return { rawBase64, pixelRatio, height: box.height, width: box.width };
  }

  async captureViewport(): Promise<RawScreenshot> {
    const { height, width } = await this.getViewportSize();
    const rawBase64 = await this.browser.takeScreenshot();
    return { rawBase64, height, width };
  }

  async capturePermutations(): Promise<RawPermutationScreenshot[]> {
    await this.windowScrollTo({ top: 0, left: 0 });

    // Adapt viewport height to fit all elements before taking screenshots
    const originalWindowSize = await this.fitWindowHeightToContent();

    const elements = await this.browser.$$('[data-permutation]').map(el => el);
    if (elements.length === 0) {
      await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);
      throw new Error('No permutations found on current page.');
    }

    const { pixelRatio } = await this.getViewportSize();
    const results: RawPermutationScreenshot[] = [];
    for (const element of elements) {
      const id = (await element.getAttribute('data-permutation')) || '';
      const rawBase64 = await this.browser.takeElementScreenshot(await element.elementId);
      const size = await element.getSize();
      results.push({
        id,
        rawBase64,
        width: size.width * pixelRatio,
        height: size.height * pixelRatio,
      });
    }

    await this.safeSetWindowSize(originalWindowSize.width, originalWindowSize.height);
    return results;
  }
}
