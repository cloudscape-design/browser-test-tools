// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScrollAction, scrollAction, getPageDimensions } from '../browser-scripts';
import BasePageObject from './base';
import fullPageScreenshot from './full-page-screenshot';

/**
 * Base class for screenshot page objects. Provides scroll helpers,
 * full-page screenshot support, and window size management.
 */
export default class ScreenshotBasePageObject extends BasePageObject {
  constructor(
    browser: WebdriverIO.Browser,
    public readonly forceScrollAndMerge: boolean = false
  ) {
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

  protected async fitWindowHeightToContent(): Promise<{ width: number; height: number }> {
    const originalWindowSize = await this.browser.getWindowSize();
    const { viewportHeight, pageHeight } = await this.browser.execute(getPageDimensions);
    const windowUIHeight = originalWindowSize.height - viewportHeight;
    await this.safeSetWindowSize(originalWindowSize.width, pageHeight + windowUIHeight);
    return originalWindowSize;
  }

  /* istanbul ignore next -- setWindowSize is unsupported on some mobile browsers, not testable in CI */
  protected async safeSetWindowSize(width: number, height: number): Promise<void> {
    try {
      await this.browser.setWindowSize(width, height);
    } catch (error) {
      if (error instanceof Error && isUnsupportedWindowResizeError(error)) {
        console.log('setWindowSize is not supported on this device');
      } else {
        throw error;
      }
    }

    /**
     * Error messages returned by mobile drivers when the browser window cannot be resized.
     * Mobile browser windows are fixed to the screen, so these are expected and safe to ignore.
     */
    const UNSUPPORTED_WINDOW_RESIZE_MESSAGES = [
      // iOS Safari via Appium XCUITest
      'Method has not yet been implemented',
      // Android Chrome 153+ via chromedriver: Browser.setWindowBounds returns a CDP error
      // instead of silently ignoring the call as older versions did
      'cannot be changed in the current Android configuration',
    ];

    function isUnsupportedWindowResizeError(error: Error): boolean {
      return UNSUPPORTED_WINDOW_RESIZE_MESSAGES.some(message => error.message.includes(message));
    }
  }
}
