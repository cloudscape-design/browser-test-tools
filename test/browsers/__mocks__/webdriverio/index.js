// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
module.exports = {
  remote: options =>
    Promise.resolve({
      ...options,
      isMobile: true,
      setTimeout: jest.fn(),
    }),
};
