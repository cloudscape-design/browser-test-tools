// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

interface ExtendedWindow extends Window {
  __liveAnnouncements?: string[];
}

export function initLiveAnnouncementsObserver() {
  const extendedWindow = window as ExtendedWindow;

  const observer = new MutationObserver(mutationList => {
    for (const mutation of mutationList) {
      if (
        mutation.type === 'childList' &&
        mutation.target instanceof HTMLElement &&
        mutation.target.hasAttribute('aria-live') &&
        mutation.target.textContent
      ) {
        if (!extendedWindow.__liveAnnouncements) {
          extendedWindow.__liveAnnouncements = [];
        }
        extendedWindow.__liveAnnouncements.push(mutation.target.textContent);
      }
    }
  });
  observer.observe(document.body, { attributes: false, childList: true, subtree: true });
}

export function getLiveAnnouncements() {
  return (window as ExtendedWindow).__liveAnnouncements ?? [];
}

export function clearLiveAnnouncements() {
  (window as ExtendedWindow).__liveAnnouncements = [];
}
