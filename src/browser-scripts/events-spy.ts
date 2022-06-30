// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
declare global {
  interface Window {
    __awsuiEvents: string[];
  }
}

export function initEventsSpy(selector: string, events: string[]) {
  window.__awsuiEvents = [];
  var element = document.querySelector(selector);
  if (!element) {
    throw new Error('Element ' + selector + ' has not been found at the page');
  }
  events.forEach(function (type) {
    element!.addEventListener(type, function (event) {
      // We ignore events bubbling from the children
      if (event.target === element) {
        window.__awsuiEvents.push(type);
      }
    });
  });
}

export function getEvents() {
  return window.__awsuiEvents;
}

export function resetEventsSpy() {
  window.__awsuiEvents = [];
}
