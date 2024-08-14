// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from 'vitest';
import { calculateIosTopOffset } from '../src/page-objects/utils';

describe('calculateIosTopOffset', () => {
  test('falls back to default offset if device cannot be identified', () => {
    expect(calculateIosTopOffset({ screenWidth: 99, screenHeight: 99, pixelRatio: 1 })).toBe(20);
    expect(calculateIosTopOffset({ screenWidth: 99, screenHeight: 99, pixelRatio: 2 })).toBe(40);
  });

  test('returns offsets for recognized devices', () => {
    // iPhone 12 Pro
    expect(calculateIosTopOffset({ screenWidth: 390, screenHeight: 844, pixelRatio: 2 })).toBe(141);

    // iPhone 11 Pro
    expect(calculateIosTopOffset({ screenWidth: 375, screenHeight: 812, pixelRatio: 2 })).toBe(132);
  });
});
