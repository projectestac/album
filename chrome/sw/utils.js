/**
 * File    : chrome/utils.js
 * Created : 08/25/2022
 * Updated:  08/25/2022
 * By      : Francesc Busquets
 *
 * Album (version for Chrome/Chromium)
 * Browser plugin that detects and lists the absolute URL of all images diplayed on the current tab
 * https://github.com/projectestac/album
 * (c) 2016-2022 Catalan Educational Telematic Network (XTEC)
 * This program is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, version. This
 * program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details. You should have received a copy of the GNU General
 * Public License along with this program. If not, see [http://www.gnu.org/licenses/].
 */

/* global chrome */

/**
 * Finds the ID of the current tab
 * @returns Promise resolving to a string
 */
export async function getCurrentTabId() {
  return chrome.tabs.query({ active: true, lastFocusedWindow: true })
    .then(tabs => {
      const currentTab = tabs && tabs[0];
      if (!currentTab)
        throw new Error('Unable to get current tab ID!');
      return currentTab.id;
    });
}
