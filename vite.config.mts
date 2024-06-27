// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from 'vitest/config';
import os from 'node:os';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './test/utils/global-setup.ts',
    testTimeout: 60000,
    poolOptions: {
      threads: {
        minThreads: 1,
        // leave half of CPU capacity for Chrome browser processes
        maxThreads: Math.max(Math.floor(os.cpus().length / 2), 1),
      },
    },
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
  },
});
