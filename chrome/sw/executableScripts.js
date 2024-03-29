/**
 * File    : chrome/sw/executableScripts.js
 * Created : 25/08/2022
 * Updated:  11/09/2022
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
 * 
 * Functions to be executed on the main document
 * 
 */

/* global chrome */

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

  // Check 'data-album-list-all-images' attribute in 'body'. If it's already set, the engine was already initialitzed
  if (typeof document.body.dataset.albumListAllImages !== 'undefined') {
    document.body.dataset.albumListAllImages = 'on';
    return 'Engine already initialized. Listing all detected images.';
  }

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
   * Call `setTimeout` as a Promise, useful for async functions
   * @param {number} ms - The amount of time to delay, in ms 
   * @returns Promise
   */
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  // VARIABLES USED BY THE ENGINE

  /**
   * Array containing all the detected images
   * @type Object[] - Array of objects of type "{imgurl, imglink}"
   */
  let allImages = [];

  /**
   * Array of objects already examined when searching for links
   * @type Object[]
   */
  let alreadyLooked = [];

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
  async function scanImages(element, deep = true) {

    // Skip text elements and other artifacts
    if (!element?.querySelectorAll)
      return false;

    // Temporary arrays used to store new discovered data
    const imgList = [];
    const objList = [];

    // Step 1: Check all 'img' objects
    const imgElements = (!deep || element.tagName === 'IMG') ? [element] : element.querySelectorAll('img');
    imgElements.forEach(img => {
      if (img.src) {
        objList.push(img);
        imgList.push(img.src);
      }
    });

    // Step 2: Inspect the element and all its descendants
    const otherElements = !deep ? [element] : element.querySelectorAll('*');
    otherElements.forEach(obj => {

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
        if (url && !allImages.find(({ imgurl }) => imgurl === exp) && (url?.protocol === 'http:' || url?.protocol === 'https:')) {

          // Object used to communicate the discovering to the webservice
          const data = { imgurl: exp };

          // Try to find links associated to this image, walking up and down the DOM tree
          const link = findLinkUp(objList[p]) || findLinkDown(objList[p]);
          if (link)
            data.imglink = link;

          // Save the discovered image into the 'allImages' array
          allImages.push(data);

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
  }

  /**
   * Reports all the already detected images to background.js
   */
  async function listScannedImages() {
    const response = await chrome.runtime.sendMessage({
      message: 'allImages',
      data: allImages,
    });
    if (response.message !== 'OK')
      console.error('Error reporting `allImages`:', response);
  }

  // MAIN LOOP
  let loopEnabled = true;
  const LOOP_INTERVAL = 1000;

  /**
   * Start a permanent loop looking for actions to be performed.
   */
  async function loop() {
    while (loopEnabled) {
      if (document.body.dataset.albumListAllImages === 'on') {
        document.body.dataset.albumListAllImages = 'off';
        await listScannedImages();
      }
      await delay(LOOP_INTERVAL);
    }
  }

  async function firstScan() {

    // Perform a full scan
    await scanImages(document.body, true);

    // Launch the mutation observer
    new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes)
          await scanImages(node, true);
        if (mutation.target)
          await scanImages(mutation.target, false);
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src', 'style', 'class', 'id'],
    });

    // launch main loop
    window.setTimeout(loop, LOOP_INTERVAL);
  }

  // Init flag
  document.body.dataset.albumListAllImages = 'off';

  // Launch first scan on next loop cycle
  window.setTimeout(firstScan, 0);

  return 'OK';
}
