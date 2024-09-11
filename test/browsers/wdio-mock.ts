// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, vi } from 'vitest';
import { RemoteConfig } from 'webdriver';

class FakeWebdriver {
  isMobile = true;
  options: RemoteConfig;

  constructor(options: RemoteConfig) {
    this.options = options;
  }

  setTimeout() {
    // noop
  }
}

export const remoteMock = vi.fn();

beforeEach(() => {
  remoteMock.mockReset();
  remoteMock.mockImplementation((options: RemoteConfig) => new FakeWebdriver(options));
});

vi.mock('webdriverio', () => ({
  remote: remoteMock,
}));
