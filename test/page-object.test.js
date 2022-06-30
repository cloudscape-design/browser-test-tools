// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { BasePageObject } = require('../src/page-objects');
const useBrowser = require('../src/use-browser').default;

function setupTest(testFn) {
  return useBrowser(async browser => {
    await browser.url('./test-page-object.html');
    await testFn(new BasePageObject(browser));
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

describe('waitForAssertion', () => {
  test(
    'successful assertion',
    setupTest(async page => {
      const assertion = jest.fn(() => expect(true).toEqual(true));
      await page.waitForAssertion(assertion);
      expect(assertion).toHaveBeenCalledTimes(1);
    })
  );

  test(
    'retrying once assertion',
    setupTest(async page => {
      let counter = 0;
      const assertion = jest.fn(() => {
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
      const assertion = jest.fn(() => expect(true).toEqual(false));
      await expect(page.waitForAssertion(assertion)).rejects.toThrowError(/toEqual/);
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
  'isVisible',
  setupTest(async page => {
    expect(await page.isDisplayed('#text-content')).toEqual(true);
    expect(await page.isDisplayed('#hidden')).toEqual(false);
    expect(await page.isDisplayed('#not-existing')).toEqual(false);
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
