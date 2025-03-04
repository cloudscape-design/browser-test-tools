// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe, vi } from 'vitest';
import { ScreenshotPageObject } from '../src/page-objects';
import useBrowser from '../src/use-browser';
import './utils/setup-local-driver';

type TestFn = (page: ScreenshotPageObject) => Promise<void>;
function setupTest(testFn: TestFn) {
  return useBrowser(async browser => {
    await browser.url('./test-page-object.html');
    await testFn(new ScreenshotPageObject(browser));
  });
}

test(
  'getText',
  setupTest(async page => {
    expect(await page.getText('#text-content')).toEqual('Some text');
  })
);

test(
  'getElementsText',
  setupTest(async page => {
    expect(await page.getElementsText('#text-content, #scrollable-container')).toEqual([
      'Some text',
      'Some scrollable text',
    ]);
  })
);

test(
  'hoverElement',
  setupTest(async page => {
    await page.hoverElement('#hover-button');
    await page.waitForVisible('#hover-span');
    expect(await page.getText('#hover-span')).toEqual('Hover success');
  })
);

test(
  'keys',
  setupTest(async page => {
    await page.click('#input-1');
    await page.keys(['Tab']);
    expect(await page.isFocused('#input-2')).toBe(true);
  })
);

test(
  'focusNextElement',
  setupTest(async page => {
    await page.click('#input-1');
    await page.focusNextElement();
    expect(await page.isFocused('#input-2')).toBe(true);
  })
);

test(
  'isSelected',
  setupTest(async page => {
    expect(await page.isSelected('#checkbox')).toBe(true);
  })
);

test(
  'getElementAttribute',
  setupTest(async page => {
    expect(await page.getElementAttribute('#checkbox', 'type')).toBe('checkbox');
  })
);

test(
  'getElementProperty',
  setupTest(async page => {
    expect(await page.getElementProperty('body', 'tagName')).toBe('BODY');
  })
);

test(
  'getElementsCount',
  setupTest(async page => {
    expect(await page.getElementsCount('input')).toBe(3);
  })
);

test(
  'setValue and getValue',
  setupTest(async page => {
    expect(await page.getValue('#input-1')).toEqual('');
    await page.setValue('#input-1', 'test');
    expect(await page.getValue('#input-1')).toEqual('test');
  })
);

test.each([
  { width: 400, height: 300 },
  { width: 300, height: 400 },
])('setWindowSize, width=$width, height=$height', size =>
  setupTest(async page => {
    await page.setWindowSize(size);
    const { width, height } = await page.getViewportSize();
    expect(width).toBe(size.width);

    // With Chromium --headless=new the window.innerHeight differs from the defined window height.
    expect(height).toBeGreaterThan(size.height - 100);
    expect(height).toBeLessThanOrEqual(size.height);
  })()
);

test(
  'spyOnEvents',
  setupTest(async page => {
    const spy = await page.spyOnEvents('#button', ['click', 'mouseover']);
    await page.click('#button');
    expect(await spy.getEvents()).toEqual(['mouseover', 'click']);
    await spy.reset();
    expect(await spy.getEvents()).toEqual([]);
  })
);

test(
  'waitForVisible',
  setupTest(async page => {
    await page.waitForVisible('#text-content');
  })
);

test(
  'waitForVisible negated',
  setupTest(async page => {
    await page.waitForVisible('#hidden', false);
  })
);

test(
  'waitForExist',
  setupTest(async page => {
    await page.waitForExist('#hidden');
    await page.waitForExist('#not-existing', false);
  })
);

describe('waitForAssertion', () => {
  test(
    'successful assertion',
    setupTest(async page => {
      const assertion = vi.fn(async () => expect(true).toBe(true));
      await page.waitForAssertion(assertion);
      expect(assertion).toHaveBeenCalledTimes(1);
    })
  );

  test(
    'retrying once assertion',
    setupTest(async page => {
      let counter = 0;
      const assertion = vi.fn(async () => {
        counter++;
        expect(counter).toEqual(2);
      });
      await page.waitForAssertion(assertion);
      expect(assertion).toHaveBeenCalledTimes(2);
    })
  );

  test(
    'reports the original error into the outer scope',
    setupTest(async page => {
      const assertion = vi.fn(async () => expect(true).toBe(false));
      await expect(page.waitForAssertion(assertion)).rejects.toThrowError(/expected true to be false/);
      expect(assertion).toHaveBeenCalledTimes(6);
    })
  );
});

test(
  'isExisting',
  setupTest(async page => {
    expect(await page.isExisting('#text-content')).toEqual(true);
    expect(await page.isExisting('#not-existing')).toEqual(false);
  })
);

test(
  'isDisplayed',
  setupTest(async page => {
    expect(await page.isDisplayed('#text-content')).toEqual(true);
    expect(await page.isDisplayed('#text-content-at-page-bottom')).toEqual(true);
    expect(await page.isDisplayed('#hidden')).toEqual(false);
    expect(await page.isDisplayed('#not-existing')).toEqual(false);
  })
);

test(
  'isDisplayedInViewport',
  setupTest(async page => {
    expect(await page.isDisplayedInViewport('#text-content')).toEqual(true);
    expect(await page.isDisplayedInViewport('#text-content-at-page-bottom')).toEqual(false);
    expect(await page.isDisplayedInViewport('#hidden')).toEqual(false);
    expect(await page.isDisplayedInViewport('#not-existing')).toEqual(false);
  })
);

test(
  'isClickable',
  setupTest(async page => {
    await expect(page.isClickable('#hover-button')).resolves.toBe(true);
    await expect(page.isClickable('#disabled-button')).resolves.toBe(false);
  })
);

test(
  'windowScrollTo/getWindowScroll',
  setupTest(async page => {
    await page.windowScrollTo({ top: 40 });
    expect(await page.getWindowScroll()).toEqual({ top: 40, left: 0 });
  })
);

test(
  'getViewportSize',
  setupTest(async page => {
    await expect(page.getViewportSize()).resolves.toEqual({
      pixelRatio: 1,
      left: 0,
      top: 0,
      width: expect.any(Number),
      height: expect.any(Number),
      pageHeight: expect.any(Number),
      screenHeight: expect.any(Number),
      screenWidth: expect.any(Number),
    });
  })
);

test(
  'elementScrollTo/getElementScroll',
  setupTest(async page => {
    await page.elementScrollTo('#scrollable-container', { left: 40 });
    expect(await page.getElementScroll('#scrollable-container')).toEqual({ top: 0, left: 40 });
  })
);

test(
  'elementScrollTo should not scroll when trying to scroll a non-scrollable element',
  setupTest(async page => {
    await expect(() => page.elementScrollTo('#text-content', { left: 40 })).rejects.toThrowError(
      /Element #text-content is not scrollable/
    );
  })
);

test(
  'elementScrollTo should scroll when one direction is scrollable',
  setupTest(async page => {
    await page.elementScrollTo('#vertically-scrollable-container', { top: 40 });
    expect(await page.getElementScroll('#vertically-scrollable-container')).toEqual({ top: 40, left: 0 });
  })
);

test(
  'elementScrollTo should not scroll in the wrong direction',
  setupTest(async page => {
    await expect(() => page.elementScrollTo('#vertically-scrollable-container', { left: 40 })).rejects.toThrowError(
      / Element #vertically-scrollable-container is not scrollable in left direction/
    );
  })
);

test(
  'scrollToRight',
  setupTest(async page => {
    const width = 400;
    const overscroll = (width * 20) / 100; // The container has 120% width
    await page.setWindowSize({ width, height: 300 });
    await page.scrollToRight('#scrollable-container');
    expect(await page.getElementScroll('#scrollable-container')).toEqual({ top: 0, left: overscroll });
  })
);

test(
  'scrollToBottom',
  setupTest(async page => {
    const testElement = '#scrollable-container';
    const { height } = await page.getBoundingBox(testElement);
    const scrollHeight = (await page.getElementProperty(testElement, 'scrollHeight')) as number;

    await page.scrollToBottom(testElement);

    const { top } = await page.getElementScroll(testElement);
    expect(top).toBeGreaterThanOrEqual(scrollHeight - height);
  })
);

test(
  'getBoundingBox',
  setupTest(async page => {
    const box = await page.getBoundingBox('#text-content');
    // we can't use absolute numbers in this assertion, because the values are different on Mac and Linux
    expect(box).toEqual({
      left: expect.any(Number),
      right: expect.any(Number),
      top: expect.any(Number),
      bottom: expect.any(Number),
      height: expect.any(Number),
      width: expect.any(Number),
    });
  })
);

test(
  'getFocusedElementText',
  setupTest(async page => {
    await page.click('#button');
    expect(await page.getFocusedElementText()).toEqual('Click me');
  })
);

test(
  'click',
  setupTest(async page => {
    await page.click('#button');
    await page.waitForVisible('#click-message');
  })
);

test(
  'click via buttonDown/buttonUp',
  setupTest(async page => {
    await page.buttonDownOnElement('#button');
    await page.buttonUp();
    await page.waitForVisible('#click-message');
  })
);

test(
  'live announcements',
  setupTest(async page => {
    await page.initLiveAnnouncementsObserver();
    await page.click('#update-live-announcement-button');
    await page.click('#update-live-announcement-button');
    await expect(page.getLiveAnnouncements()).resolves.toEqual(['update 1', 'update 2']);
    await page.clearLiveAnnouncements();
    await expect(page.getLiveAnnouncements()).resolves.toEqual([]);
  })
);

test(
  'runInsideIframe',
  setupTest(async page => {
    await expect(page.isExisting('#inside-iframe')).resolves.toBe(false);
    await page.runInsideIframe('#test-iframe', true, async () => {
      await expect(page.isExisting('#inside-iframe')).resolves.toBe(true);
    });
    // make sure we exit the iframe properly
    await expect(page.isExisting('#inside-iframe')).resolves.toBe(false);
    await page.runInsideIframe('#test-iframe', false, async () => {
      // should skip switching to iframe here
      await expect(page.isExisting('#inside-iframe')).resolves.toBe(false);
    });
  })
);
