// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, vi } from 'vitest';
import type { RemoteOptions } from 'webdriverio';

class FakeWebdriver {
  isMobile = true;
  options: RemoteOptions;

  constructor(options: RemoteOptions) {
    this.options = options;
  }

  setTimeout() {
    // noop
  }
}

export const remoteMock = vi.fn();

beforeEach(() => {
  remoteMock.mockReset();
  remoteMock.mockImplementation((options: RemoteOptions) => new FakeWebdriver(options));
});

vi.mock('webdriverio', () => ({
  remote: remoteMock,
}));
