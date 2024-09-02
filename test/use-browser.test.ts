// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, vi } from 'vitest';
import { promisify } from 'util';
import useBrowser from '../src/use-browser';
import { configure } from '../src/use-browser';
import { getViewportSize } from '../src/browser-scripts';
import './utils/setup-local-driver';

const delay = promisify(setTimeout);

test(
  'should work as a test function wrapper',
  useBrowser(async browser => {
    await browser.url('./index.html');
    const content = await (await browser.$('#text-block')).getText();
    expect(content).toEqual('It works!');
  })
);

test.each([
  { width: 600, height: 400 },
  { width: 400, height: 600 },
  { width: 1900, height: 1200 },
])('should allow to override browser options, width=$width, height=$height', size =>
  useBrowser(size, async browser => {
    await browser.url('./index.html');
    const { width, height } = await browser.execute(getViewportSize);
    expect(width).toBe(size.width);

    // With Chromium --headless=new the window.innerHeight differs from the defined window height.
    expect(height).toBeGreaterThan(size.height - 100);
    expect(height).toBeLessThanOrEqual(size.height);
  })()
);

test('should close browser after test finish', async () => {
  const onDeleteSession = vi.fn();
  await useBrowser(async browser => {
    // FIXME: Casting to any isn't ideal, but it's the only way to overwrite this command
    (browser as any).overwriteCommand('deleteSession', async (originalCommand: any) => {
      await originalCommand();
      onDeleteSession();
    });
  })();
  expect(onDeleteSession).toHaveBeenCalled();
});

// the browser is configured to wait for 3x5000ms before throwing an error
// so we need to increase the default timeout to 15000
test('propagates an error happened in test', { timeout: 15000 }, async () => {
  function brokenTest() {
    return useBrowser(async browser => {
      await (await browser.$('#not-existing')).click();
    })();
  }
  await expect(brokenTest()).rejects.toThrowError(
    /Can't call click on element with selector "#not-existing" because element wasn't found/
  );
});

test('should not fail if there are errors in browser console and enableBrowserErrors is disabled', async () => {
  configure({ skipConsoleErrorsCheck: true });
  function errorTest() {
    return useBrowser(async browser => {
      await browser.url('./index.html');
      await (await browser.$('#error-button')).click();
    })();
  }
  await expect(errorTest()).resolves.toBeUndefined();
  configure({ skipConsoleErrorsCheck: false });
});

test('should fail if there are errors in browser console', async () => {
  function errorTest() {
    return useBrowser(async browser => {
      await browser.url('./index.html');
      await (await browser.$('#error-button')).click();
    })();
  }
  await expect(errorTest()).rejects.toThrow(/Unexpected errors in browser console:[\s\S]*test error/);
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
  const threadWithDelay = () =>
    delay(200).then(() =>
      useBrowser(browser => {
        browser.url('./index.html');
      })()
    );

  return Promise.all([threadOne(), threadTwo(), threadThree(), threadWithDelay()]);
});
