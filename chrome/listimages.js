/**
 * File    : chrome/listimages.js
 * Created : 20/03/2016
 * By      : Francesc Busquets
 *
 * Album (version for Chrome/Chromium)
 * Browser plugin that detects and lists the absolute URL of all images diplayed on the current tab
 * https://github.com/projectestac/album
 * (c) 2000-2016 Catalan Educational Telematic Network (XTEC)
 * This program is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, version. This
 * program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details. You should have received a copy of the GNU General
 * Public License along with this program. If not, see [http://www.gnu.org/licenses/].
 */

/* global window, document, chrome */

/**
 * ListImages is the main object used in this script.
 * It provides methods for locating the images existing in the DOM tree
 * and reporting the absolute URL of found images to the extension popup.
 */
var ListImages = function () {
  // Initialize arrays for images and links
  this.allImages = [];
  this.allLinks = [];
};

ListImages.prototype = {
  constructor: ListImages,
  /**
   * Array containing all the detected images
   * @type String[]
   */
  allImages: null,
  /**
   * Array containing the link associated to each image (when any)
   * @type String[]
   */
  allLinks: null,
  /**
   * Numeric identifier of the background process responsible for the detection
   * of images and links
   * @type Number
   */
  scanProcess: null,
  /**
   * Flag indicating that the scan process is currently running
   * @type Boolean
   */
  scanning: false,
  /**
   * When 'true', the script is reporting results to the extension popup.
   * @type Boolean
   */
  reporting: false,
  /**
   * The document is scanned again every two seconds
   * @type Number
   */
  SCAN_INTERVAL: 2000,
  /**
   * This function scans the main document searching for images
   */
  scanImages: function () {

    // Avoid re-entrant processing
    if (this.scanning || this.reporting)
      return;
    this.scanning = true;

    // Temporary arrays used to store newly discovered data
    var imgList = [];
    var objList = [];

    // Check 'img' objects
    var obj = document.querySelectorAll('img');
    for (var n = 0; n < obj.length; n++) {
      if (obj[n].src) {
        objList.push(obj[n]);
        imgList.push(obj[n].src);
      }
    }

    // Inspect all objects in DOM
    obj = document.body.getElementsByTagName('*');
    for (var p = 0; p < obj.length; p++) {
      // Check if object has style property 'background-image' starting by 'url('
      var bg = window.getComputedStyle(obj[p]).getPropertyValue('background-image').trim();
      if(bg && bg.trim().toLowerCase().substring(0, 4) === 'url(') {
        // Find first 'non-whitespace' character after open parenthesis
        var leftP=4;
        while(bg.charAt(leftP)===' ' && leftP<bg.length)
          leftP++;
        var first = bg.charAt(leftP);
        // Decide what character should close the expression
        // default without quotes is ')'
        var rightDelim = ')';
        if(first==='"')
          rightDelim='"';
        else if(first==='\'')
          rightDelim='\'';
        else
          // No special delimiter, so leftP must point to the open parenthesis
          leftP--;
        // Find closing character
        var rightP = bg.indexOf(rightDelim, leftP+1);
        if(rightP<0)
          rightP=bg.length;

        // Get the fragment between (but not including) delimiters
        bg = bg.substring(leftP+1, rightP).trim();

        // Save URL and element
        imgList.push(bg);
        objList.push(obj[p]);
      }
    }

    // Filter invalid URLs
    for (var img = 0; img < imgList.length; img++) {
      var exp = imgList[img];
      try {
        var url = new URL(exp);
        if (url && this.allImages.indexOf(exp) === -1 && url.protocol &&
                (url.protocol === 'http:' || url.protocol === 'https:')) {

          // Save the discovered image into the 'allImages' array
          this.allImages.push(exp);

          // object used to communicate with the extension popup
          var msg = {imgurl: exp};

          // Try to find links associated to this image, walking up and down
          // the DOM tree
          var link = findLinkUp(objList[img]);
          if (link === null)
            link = findLinkDown(objList[img]);
          // If found, save link
          if (link) {
            this.allLinks[this.allImages.length - 1] = link;
            msg.imglink = link;
          }

          // Notify the existence of a new image to the extension popup
          chrome.runtime.sendMessage(msg);
        }
      } catch (ex) {
        // Something bad has happened
        console.log('Album extension: Error processing element ' + img + ':\n' + exp + ' - ' + ex);
      }
    }
    this.scanning = false;
  },
  /**
   * Starts the scanning process as a daemon
   */
  startScanning: function () {
    if (this.scanProcess)
      this.endScanning();
    var thisObj = this;
    this.scanProcess = window.setInterval(function () {
      thisObj.scanImages();
    }, this.SCAN_INTERVAL);
  },
  /**
   * Stops the scanning daemon
   */
  endScanning: function () {
    if (this.scanProcess) {
      window.clearInterval(this.scanProcess);
      this.scanProcess = null;
    }
  },
  /**
   * Reports all the detected images, sending messages to the extension popup
   */
  listScannedImages: function () {
    this.reporting = true;
    for (var i = 0; i < this.allImages.length; i++) {
      var obj = {imgurl: this.allImages[i]};
      if (this.allLinks[i])
        obj.imglink = this.allLinks[i];
      chrome.runtime.sendMessage(obj);
    }
    this.reporting = false;
  }
};

// UTILITY FUNCTIONS:

/**
 * Array of objects already examined when searching for links
 * @type Object[]
 */
var alreadyLooked = [];

/**
 * Walks up on the DOM tree searching for objects of type 'a' with 'href'
 * @param {HTMLElement} obj - The HTML element to check for. If it's not of the
 * desired type, the search will continue with its parent.
 */
var findLinkUp = function (obj) {
  if (obj.nodeName.toLowerCase() === 'a') {
    if (obj.getAttribute('href'))
      return absoluteLink(obj);
  }
  if (alreadyLooked.indexOf(obj) === -1)
    alreadyLooked.push(obj);
  var parent = obj.parentElement;
  return parent ? this.findLinkUp(parent) : null;
};

/**
 * Walks down on the DOM tree searching for objects of type 'a' with 'href'
 * @param {HTMLElement} obj - The HTML element to check for. If it's not of the
 * desired type, the search will continue with its children.
 */
var findLinkDown = function (obj) {
  if (obj.nodeName.toLowerCase() === 'a') {
    if (obj.getAttribute('href'))
      return absoluteLink(obj);
  }
  for (var i = 0; i < obj.children.length; i++) {
    var child = obj.children.item(i);
    if (child) {
      var link = findLinkDown(child);
      if (link)
        return link;
    }
  }
  return  null;
};

/**
 * Builds a link with the absolute URL of the provided link
 * @param {URL} link
 * @returns {String}
 */
var absoluteLink = function (link) {
  return link.protocol ? link.protocol + "//" + link.host + link.pathname + link.search + link.hash : null;
};

// MAIN:

// On the first execution, create an object of type 'ListImages' and assign it to
// the global variable '__listImages'.
// Otherwise, if '__listImages' already exists, report detected images to
// the extension popup
if (typeof window.__listImages === 'undefined')
  window.__listImages = new ListImages();
else
  window.__listImages.listScannedImages();

// Instruct '__listImages' to start the scanning daemon
window.__listImages.startScanning();
