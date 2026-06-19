// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, vi } from 'vitest';
import type { remote } from 'webdriverio';

// Derive the config type from `remote` itself so the fake tracks the dependency
// automatically instead of importing a (non-existent) named type.
type RemoteConfig = Parameters<typeof remote>[0];

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
