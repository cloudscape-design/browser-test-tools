// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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

export const remoteMock = jest.fn();

beforeEach(() => {
  remoteMock.mockReset();
  remoteMock.mockImplementation((options: RemoteOptions) => new FakeWebdriver(options));
});

jest.mock('webdriverio', () => ({
  remote: remoteMock,
}));
