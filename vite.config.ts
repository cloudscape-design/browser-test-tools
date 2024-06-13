// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './test/utils/global-setup.ts',
    testTimeout: 15000,
    coverage: {
      enabled: process.env.CI === 'true',
      provider: 'istanbul',
      include: ['src/**'],
      exclude: [
        '**/debug-tools/**',
        '**/test/**',
        'src/browser-scripts/**',
        'src/page-objects/browser-scripts.ts',
        'src/chrome-launcher.ts',
      ],
    },
    reporters: ['hanging-process'],
  },
});
