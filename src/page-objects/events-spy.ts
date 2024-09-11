// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Browser } from 'webdriverio';
import { getEvents, initEventsSpy, resetEventsSpy } from '../browser-scripts';

export default class EventsSpy {
  constructor(private browser: Browser, private selector: string, private events: string[]) {}

  async init() {
    await this.browser.execute(initEventsSpy, this.selector, this.events);
  }

  async getEvents(): Promise<string[]> {
    return this.browser.execute(getEvents);
  }

  async reset() {
    await this.browser.execute(resetEventsSpy);
  }
}
