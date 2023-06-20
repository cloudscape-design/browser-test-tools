// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    setupFiles: './test/utils/setup.ts',
    globalSetup: ['./test/utils/global-setup.ts'],
    testTimeout: 80000,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/browser-scripts/**', 'src/page-objects/browser-scripts.ts', 'src/chrome-launcher.ts'],
    },
  },
});
