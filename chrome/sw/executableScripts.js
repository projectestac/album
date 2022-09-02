/**
 * File    : chrome/sw/executableScripts.js
 * Created : 08/25/2022
 * Updated:  08/28/2022
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
 * Enable the 'album-scan-enabled' body attribute
 * @returns String
 */
export function startScanning() {
  document.body.dataset.albumScanEnabled = 'on';
  return 'Scanner running';
}

/**
 * Disable the 'album-scan-enabled' body attribute
 * @returns String
 */
 export function stopScanning() {
  document.body.dataset.albumScanEnabled = 'off';
  return 'Scanner stopped';
}

/**
 * Set the 'album-list-all-images' body attribute
 * The change will be detected on the next 'loop' cycle, starting the notifications
 * @returns String
 */
 export function listAllImages() {
  document.body.dataset.albumListAllImages = 'on';
  return 'Requested list of all images';
}

/**
 * Initializes the 'scan for images' service on the main document
 * @returns String
 */
export function initEngine() {

  // Check 'data-album-scan-enabled' attribute in 'body'. If it's already set, the engine was already initialitzed
  if (typeof document.body.dataset.albumScanEnabled !== 'undefined')
    return 'ListImages daemon was already initialized in this document';

  // UTILITY FUNCTIONS
  // Should be defined on this closure, because imported or global-defined functions are out of scope when
  // running from "chrome.scripting.executeScript"

  /**
   * Converts an URL object to a string
   * @param {URL} link - Object of type [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL) 
   * @returns String 
   */
  const absoluteLink = link => link.protocol ? `${link.protocol}//${link.host}${link.pathname}${link.search}${link.hash}` : null;

  /**
   * setTimeout as a Promise, useful for async functions
   * @param {number} ms - The amount of time to delay, in ms 
   * @returns Promise
   */
  function delay(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  // VARIABLES USED BY THE ENGINE

  /**
   * Array containing all the detected images
   * @type String[]
   */
  let allImages = [];

  /**
   * Array containing the link associated to each image (when any)
   * @type String[]
   */
  let allLinks = [];

  /**
   * Array of objects already examined when searching for links
   * @type Object[]
   */
  let alreadyLooked = [];

  /**
   * Flag indicating that the scan process is currently running
   * @type Boolean
   */
  let scanning = false;

  /**
   * When 'true', the script is reporting results to the extension popup.
   * @type Boolean
   */
  let reporting = false;

  // AUXILIAR FUNCTIONS

  /**
   * Walks up on the DOM tree searching for objects of type 'a' with 'href' attribute
   * @param {HTMLElement} obj - The HTML element to check for. If it's not of the
   * desired type, the search will continue with its parent.
   */
   function findLinkUp(obj) {
    if (obj.nodeName.toLowerCase() === 'a' && obj.getAttribute('href'))
      return absoluteLink(obj);
    if (!alreadyLooked.includes(obj))
      alreadyLooked.push(obj);
    const parent = obj.parentElement;
    return parent ? findLinkUp(parent) : null;
  }

  /**
   * Walks down on the DOM tree searching for objects of type 'a' with 'href' attribute
   * @param {HTMLElement} obj - The HTML element to check for. If it's not of the
   * desired type, the search will continue with its children.
   */
  function findLinkDown(obj) {
    if (obj.nodeName.toLowerCase() === 'a' && obj.getAttribute('href'))
      return absoluteLink(obj);

    let result = null;
    [...obj.children].some(child => {
      result = findLinkDown(child);
      return result !== null;
    });
    return result;
  }

  // MAIN FUNCTIONS

  /**
   * This function scans the whole DOM structure, searching for images
   * both as "img" elements or declared as a "background-image" in CSS attributes
   */
  async function scanImages() {

    // Avoid re-entrant processing
    if (scanning || reporting)
      return;

    // Set the scanning flag
    scanning = true;

    // Temporary arrays used to store new discovered data
    const imgList = [];
    const objList = [];

    // Step 1: Check all 'img' objects
    document.querySelectorAll('img').forEach(img => {
      if (img.src) {
        objList.push(img);
        imgList.push(img.src);
      }
    });

    // Step 2: Inspect all objects in DOM
    document.body.querySelectorAll('*').forEach(obj => {

      // Check if object has style property 'background-image' starting by 'url('
      let bg = window.getComputedStyle(obj)?.getPropertyValue('background-image')?.trim();
      if (bg && bg.trim().toLowerCase().substring(0, 4) === 'url(') {
        // Find first 'non-whitespace' character after open parenthesis
        let leftP = 4;
        while (bg.charAt(leftP) === ' ' && leftP < bg.length)
          leftP++;
        let first = bg.charAt(leftP);
        // Decide what character should close the expression
        // default without quotes is ')'
        let rightDelim = ')';
        if (first === '"')
          rightDelim = '"';
        else if (first === '\'')
          rightDelim = '\'';
        else
          // No special delimiter, so leftP must point to the open parenthesis
          leftP--;
        // Find closing character
        let rightP = bg.indexOf(rightDelim, leftP + 1);
        if (rightP < 0)
          rightP = bg.length;

        // Get the fragment between (but not including) delimiters
        bg = bg.substring(leftP + 1, rightP).trim();

        // Save URL and element
        imgList.push(bg);
        objList.push(obj);
      }
    });

    // Step 3: Filter invalid URLs and send 'newImage' messages for each new discovered image
    for (const [p, exp] of imgList.entries()) {
      try {
        const url = new URL(exp);
        if (url && !allImages.includes(exp) && (url?.protocol === 'http:' || url?.protocol === 'https:')) {

          // Save the discovered image into the 'allImages' array
          allImages.push(exp);

          // Object used to communicate the discovering to the webservice
          const data = { imgurl: exp };

          // Try to find links associated to this image, walking up and down the DOM tree
          const link = findLinkUp(objList[p]) || findLinkDown(objList[p]);
          if (link) {
            allLinks[allImages.length - 1] = link;
            data.imglink = link;
          }

          // Notify the existence of a new image to the extension popup
          const response = await chrome.runtime.sendMessage({
            message: 'newImage',
            data,
          });
          if (response.message !== 'OK')
            console.error('Error reporting new image:', response);
        }
      } catch (exception) {
        console.error(`Album extension: Error processing "${exp}"`, exception);
      }
    }

    // Remove the scanning flag
    scanning = false;
  }

  /**
   * Reports all the already detected images to background.js
   */
  async function listScannedImages() {
    // Set the reporting flag, to avoid possible re-entrant scannings
    reporting = true;
    for (const [p, img] of allImages.entries()) {
      const data = { imgurl: img };
      if (allLinks[p])
        data.imglink = allLinks[p];
      const response = await chrome.runtime.sendMessage({
        message: 'newImage',
        data,
      });
      if (response.message !== 'OK')
        console.error('Error reporting new image:', response);
    }
    reporting = false;
  }

  // MAIN LOOP
  let loopEnabled = true;
  const LOOP_INTERVAL = 1000;

  /**
   * Will loop permanently, looking for actions to be performed,
   * defined as "data-album-xxx" attributes in the 'body' element
   * This was the only effective way of communication between the service worker
   * and a javascript service running on the main document
   */
  async function loop() {
    while (loopEnabled) {
      if (document.body.dataset.albumListAllImages === 'on') {
        document.body.dataset.albumListAllImages = 'off';
        await listScannedImages();
      }
      else if (document.body.dataset.albumScanEnabled === 'on') {
        await scanImages();
      }
      await delay(LOOP_INTERVAL);
    }
  }

  // Set flags and launch the main loop on the next process cycle
  document.body.dataset.albumScanEnabled = 'off';
  document.body.dataset.albumListAllImages = 'off';
  window.setTimeout(loop, 0);

  return 'OK';
}
