// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import pRetry from 'p-retry';

import {
  getElementScrollPosition,
  getWindowScrollPosition,
  scrollAction,
  windowScrollTo,
  getViewportSize,
  ScrollPosition,
  getBoundingClientRect,
} from '../browser-scripts';
import EventsSpy from './events-spy';
import * as liveAnnouncements from '../browser-scripts/live-announcements';
import { getElementCenter } from './utils';

import { ElementRect } from './types';
import { waitForTimerAndAnimationFrame } from './browser-scripts';
import { Browser } from 'webdriverio';

export default class BasePageObject {
  constructor(protected browser: Browser) {}

  async pause(milliseconds: number) {
    await this.browser.pause(milliseconds);
  }

  async keys(keys: string | string[]) {
    await this.browser.keys(keys);
  }

  async setWindowSize({ width, height }: { width: number; height: number }) {
    await this.browser.setWindowSize(width, height);
  }

  async spyOnEvents(selector: string, events: string[]) {
    const spy = new EventsSpy(this.browser, selector, events);
    await spy.init();
    return spy;
  }

  async click(selector: string) {
    const element = await this.browser.$(selector);
    await element.click();
  }

  async hoverElement(selector: string, xOffset?: number, yOffset?: number) {
    const element = await this.browser.$(selector);
    await element.moveTo({ xOffset, yOffset });
  }

  async buttonDownOnElement(selector: string) {
    // Clean up all previous actions before stating a new batch. Without this line Safari emits extra "mouseup" events
    await this.browser.releaseActions();
    const box = await this.getBoundingBox(selector);
    const center = getElementCenter(box);
    // W3C alternative is `performActions`. All consecutive actions have to be a part of a single call
    await this.browser.performActions([
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', duration: 0, x: center.x, y: center.y },
          { type: 'pointerDown', button: 0 },
          // extra delay to let event listeners to be fired
          { type: 'pause', duration: 10 },
        ],
      },
    ]);
  }

  async buttonUp() {
    // W3C alternative is `performActions`
    await this.browser.performActions([
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerUp', button: 0 },

          // extra delay for Safari to process the event before moving the cursor away
          { type: 'pause', duration: 10 },
          // return cursor back to the corner to avoid hover effects on screenshots
          { type: 'pointerMove', duration: 0, x: 0, y: 0 },
        ],
      },
    ]);
    // make sure all controls are properly released to avoid conflicts with further actions
    await this.browser.releaseActions();
  }

  async dragAndDrop(sourceSelector: string, xOffset = 0, yOffset = 0) {
    const element = await this.browser.$(sourceSelector);
    await element.dragAndDrop({ x: xOffset, y: yOffset });
  }

  async getValue(selector: string) {
    const element = await this.browser.$(selector);
    return element.getValue();
  }

  async setValue(selector: string, value: number | string) {
    const element = await this.browser.$(selector);
    await element.setValue(value);
  }

  async getViewportSize() {
    return this.browser.execute(getViewportSize);
  }

  async getWindowScroll(): Promise<ScrollPosition> {
    return this.browser.execute(getWindowScrollPosition);
  }

  async windowScrollTo({ top = 0, left = 0 }: Partial<ScrollPosition>) {
    await this.browser.execute(windowScrollTo, top, left);
    await this.pause(100);
  }

  async getElementScroll(selector: string): Promise<ScrollPosition> {
    return this.browser.execute(getElementScrollPosition, selector);
  }

  async elementScrollTo(selector: string, { top = 0, left = 0 }: Partial<ScrollPosition>) {
    await this.browser.execute(scrollAction, 'scrollToOffset', selector, { top, left });
  }

  async waitForVisible(selector: string, shouldDisplay = true, timeout?: number) {
    await this.browser.waitUntil(
      async () => {
        const isDisplayed = await this.isDisplayed(selector);
        return isDisplayed === shouldDisplay;
      },
      {
        timeout,
        timeoutMsg: shouldDisplay
          ? `Element "${selector}" is not visible upon waiting`
          : `Element "${selector}" is still visible after waiting`,
      }
    );
  }

  waitForExist(selector: string, shouldExist = true, timeout?: number) {
    return this.browser.$(selector).waitForExist({
      reverse: !shouldExist,
      timeout,
      timeoutMsg: shouldExist
        ? `Element "${selector}" is not existing upon waiting`
        : `Element "${selector}" is still existing after waiting`,
    });
  }

  async waitForAssertion(expression: () => Promise<void>) {
    const retryOptions = { minTimeout: 100, retries: 5 };
    await pRetry(expression, retryOptions);
  }

  // setTimeout and requestAnimationFrame on the page
  async waitForJsTimers(timeout: number = 0) {
    await this.browser.executeAsync(waitForTimerAndAnimationFrame, timeout);
  }

  async isFocused(selector: string) {
    const element = await this.browser.$(selector);
    return element.isFocused();
  }

  async isSelected(selector: string) {
    const element = await this.browser.$(selector);
    return element.isSelected();
  }

  async isExisting(selector: string) {
    const elements = await this.browser.$$(selector).map(element => element);
    return elements.length > 0;
  }

  async isDisplayed(selector: string) {
    const element = await this.browser.$(selector);
    return element.isDisplayed();
  }

  async isDisplayedInViewport(selector: string) {
    const element = await this.browser.$(selector);
    return element.isDisplayed({ withinViewport: true });
  }

  async isClickable(selector: string) {
    const element = await this.browser.$(selector);
    return element.isClickable();
  }

  async getElementAttribute(selector: string, attributeName: string) {
    const element = await this.browser.$(selector);
    return element.getAttribute(attributeName);
  }

  async getElementProperty(selector: string, propertyName: string) {
    const element = await this.browser.$(selector);
    return element.getProperty(propertyName);
  }

  async getElementsCount(selector: string) {
    const elements = await this.browser.$$(selector);
    return elements.length;
  }

  async getFocusedElementText() {
    const activeNode = await this.browser.getActiveElement();
    const element = await this.browser.$(activeNode);
    return element.getText();
  }

  async getBoundingBox(selector: string): Promise<ElementRect> {
    return this.browser.execute(getBoundingClientRect, selector);
  }

  async getText(selector: string) {
    const element = await this.browser.$(selector);
    return element.getText();
  }

  async getElementsText(selector: string) {
    const elements = await this.browser.$$(selector).map(element => element);
    return Promise.all(elements.map(async element => element.getText()));
  }

  /**
   * Attaches observer to collect all live updates from the page that can be fetched with page.getLiveAnnouncements().
   */
  async initLiveAnnouncementsObserver() {
    await this.browser.execute(liveAnnouncements.initLiveAnnouncementsObserver);
  }

  async getLiveAnnouncements() {
    return await this.browser.execute(liveAnnouncements.getLiveAnnouncements);
  }

  async clearLiveAnnouncements() {
    await this.browser.execute(liveAnnouncements.clearLiveAnnouncements);
  }

  async runInsideIframe(iframeSelector: string, shouldSwitch: boolean, callback: () => Promise<void>) {
    if (!shouldSwitch) {
      return callback();
    }
    const iframeEl = await this.browser.$(iframeSelector);
    await this.browser.switchFrame(iframeEl);
    await callback();
    // go back to top
    await this.browser.switchFrame(null);
  }
}
