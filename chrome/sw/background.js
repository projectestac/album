/**
 * File    : chrome/sw/background.js
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

import { getCurrentTabId } from "./utils.js";
import { startScanning, stopScanning, listAllImages, initEngine } from "./executableScripts.js";

// Collections of images pending to be reported to popup.js (one collection per tab)
let imgBuffer = {};

// Get the image buffer associated to a specific tab
function getImgBuffer(tabId) {
  imgBuffer[tabId] = imgBuffer[tabId] || [];
  return imgBuffer[tabId];
}

// Clear the image buffer associated to a specific tab
function clearImgBuffer(tabId) {
  getImgBuffer(tabId).length = 0;
}

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  processMessage(request, sender?.tab?.id)
    .then(sendResponse);
  return true;
});

// Process incoming messages
async function processMessage(request, tabId) {

  try {
    let result = null;

    tabId = tabId || await getCurrentTabId();
    if (!tabId)
      return { message: 'ERROR', reason: 'Unable to get the current tab ID' };

    switch (request.message) {
      case 'init':
        result = await chrome.scripting.executeScript({ target: { tabId }, func: initEngine });
        break;

      case 'startScanning':
        result = await chrome.scripting.executeScript({ target: { tabId }, func: startScanning });
        break;

      case 'stopScanning':
        result = await chrome.scripting.executeScript({ target: { tabId }, func: stopScanning });
        break;

      case 'newImage':
        getImgBuffer(tabId).push(request.data);
        break;

      case 'allImages':
        getImgBuffer(tabId).push(...request.data);
        break;

      case 'getImages':
        result = [...getImgBuffer(tabId)];
        clearImgBuffer(tabId);
        break;

      case 'notify':
        result = await showNotification(request);
        break;

      default:
        console.error('ERROR: Unknown message received', request);
        return { message: 'ERROR', reason: `Unknown message: "${request.message}"` };
    }
    return { message: 'OK', result };
  }
  catch (err) {
    return { message: 'ERROR', reason: err };
  }

}

// Notify the user when a request is ready
const NOTIFICATION_ID = 'ALBUM_EXTENSION_ID';
let currentUrl = null;

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === NOTIFICATION_ID) {
    switch (buttonIndex) {
      case 0:
        if (currentUrl)
          chrome.tabs.create({
            active: true,
            url: currentUrl,
          });
        break;
      default:
        console.error(`Unknown notification button clicked: ${buttonIndex}`);
    }
  }
});

async function showNotification(options) {
  return new Promise((resolve, _reject) => {
    const { messageTitle, messageText, contextMessage = '', url, buttonText, buttonIcon } = options;
    currentUrl = url;
    chrome.notifications.create(
      NOTIFICATION_ID,
      {
        type: 'basic',
        title: messageTitle,
        message: messageText,
        contextMessage,
        iconUrl: '../icons/icon48.png',
        requireInteraction: true,
        buttons: url ? [{
          title: buttonText,
          iconUrl: `../icons/${buttonIcon}`,
        }] : [],
      },
      result => resolve(`Notification ID is: ${result}`)
    );
  });
}
