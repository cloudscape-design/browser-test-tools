// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const responses = {
  pass: () => Promise.resolve({ url: 'http://localhost:4444' }),
  invalid: () => Promise.resolve({ invalid: true }),
  throttling: () => {
    const error = new Error('ThrottlingException');
    error.code = 'ThrottlingException';
    return Promise.reject(error);
  },
  unknown: () => Promise.reject(new Error('unknown error')),
};

function DeviceFarmClientMock() {
  // no-op
}
DeviceFarmClientMock.prototype.createTestGridUrl = jest.fn(({ projectArn }) => {
  return {
    promise: () => responses[projectArn](),
  };
});

module.exports = DeviceFarmClientMock;
