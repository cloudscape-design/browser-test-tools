// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import getBrowserCreator from '../src/browser';

test('should throw on unknown type of selenium provider', () => {
  expect(() => getBrowserCreator('Chrome', 'foo', {})).toThrow('Incorrect selenium provider: foo');
});

test('should throw on unknown browser', async () => {
  const creator = getBrowserCreator('Edge', 'local', {});
  await expect(creator.getBrowser({})).rejects.toThrow('Browser Edge is not supported in this provider');
});
