// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const { promisify } = require('util');
const useBrowser = require('../src/use-browser').default;
const { getViewportSize } = require('../src/browser-scripts');
const delay = promisify(setTimeout);

test(
  'should work as a test function wrapper',
  useBrowser(async browser => {
    await browser.url('./index.html');
    const content = await (await browser.$('#text-block')).getText();
    expect(content).toEqual('It works!');
  })
);

test(
  'should allow to override browser options',
  useBrowser({ width: 600, height: 400 }, async browser => {
    await browser.url('./index.html');
    const { width, height } = await browser.execute(getViewportSize);
    expect({ width, height }).toEqual({ width: 600, height: 400 });
  })
);

test('should close browser after test finish', async () => {
  const onDeleteSession = jest.fn();
  await useBrowser(async browser => {
    browser.overwriteCommand('deleteSession', async originalCommand => {
      await originalCommand();
      onDeleteSession();
    });
  })();
  expect(onDeleteSession).toHaveBeenCalled();
});

test('propagates an error happened in test', async () => {
  // the browser is configured to wait for 3x5000ms before throwing an error
  // so we need to increasing jest default timeout
  jest.setTimeout(20 * 10000);
  function brokenTest() {
    return useBrowser(async browser => {
      await (await browser.$('#not-existing')).click();
    })();
  }
  await expect(brokenTest()).rejects.toThrowError(
    /Can't call click on element with selector "#not-existing" because element wasn't found/
  );
});

test('should fail if there are errors in browser console', async () => {
  function errorTest() {
    return useBrowser(async browser => {
      await browser.url('./index.html');
      await (await browser.$('#error-button')).click();
    })();
  }
  await expect(errorTest()).rejects.toThrow(/There should be no errors in the console/);
});

test('should ignore warnings in browser console', async () => {
  await useBrowser(async browser => {
    await browser.url('./index.html');
    await (await browser.$('#warning-button')).click();
  })();
});

test('should run multiple browsers in parallel', () => {
  const threadOne = useBrowser(async browser => {
    await browser.url('./index.html');
    await browser.pause(400);
  });
  const threadTwo = useBrowser(async browser => {
    await browser.url('./index.html');
    await browser.pause(400);
  });
  const threadThree = useBrowser(async browser => {
    await browser.url('./index.html');
    await browser.pause(400);
  });
  const threadWithDelay = () => delay(200).then(() => useBrowser(browser => browser.url('./index.html'))());

  return Promise.all([threadOne(), threadTwo(), threadThree(), threadWithDelay()]);
});
