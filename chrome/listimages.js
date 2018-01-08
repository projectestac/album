/**
 * File    : chrome/listimages.js
 * Created : 20/03/2016
 * By      : Francesc Busquets
 *
 * Album (version for Chrome/Chromium)
 * Browser plugin that detects and lists the absolute URL of all images diplayed on the current tab
 * https://github.com/projectestac/album
 * (c) 2016-2018 Catalan Educational Telematic Network (XTEC)
 * This program is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, version. This
 * program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details. You should have received a copy of the GNU General
 * Public License along with this program. If not, see [http://www.gnu.org/licenses/].
 */

/* global window, document, chrome */

// Declare the main object just once
if (typeof window.__ListImages === 'undefined') {
  /**
   * ListImages is the main object used in this script.
   * It provides methods for locating the images existing in the DOM tree
   * and reporting the absolute URL of found images to the extension popup.
   */
  window.__ListImages = function () {
    // Initialize arrays for images and links
    this.allImages = []
    this.allLinks = []
  }

  window.__ListImages.prototype = {
    constructor: window.__ListImages,
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
        return
      this.scanning = true

      // Temporary arrays used to store newly discovered data
      const imgList = []
      const objList = []

      // Check 'img' objects
      document.querySelectorAll('img').forEach(img => {
        if (img.src) {
          objList.push(img)
          imgList.push(img.src)
        }
      })

      // Inspect all objects in DOM
      document.body.querySelectorAll('*').forEach(obj => {
        // Check if object has style property 'background-image' starting by 'url('
        let bg = window.getComputedStyle(obj).getPropertyValue('background-image').trim()
        if (bg && bg.trim().toLowerCase().substring(0, 4) === 'url(') {
          // Find first 'non-whitespace' character after open parenthesis
          let leftP = 4
          while (bg.charAt(leftP) === ' ' && leftP < bg.length)
            leftP++
          let first = bg.charAt(leftP)
          // Decide what character should close the expression
          // default without quotes is ')'
          let rightDelim = ')'
          if (first === '"')
            rightDelim = '"'
          else if (first === '\'')
            rightDelim = '\''
          else
            // No special delimiter, so leftP must point to the open parenthesis
            leftP--
          // Find closing character
          let rightP = bg.indexOf(rightDelim, leftP + 1)
          if (rightP < 0)
            rightP = bg.length

          // Get the fragment between (but not including) delimiters
          bg = bg.substring(leftP + 1, rightP).trim()

          // Save URL and element
          imgList.push(bg)
          objList.push(obj)
        }
      })

      // Filter invalid URLs
      imgList.forEach((exp, img) => {
        try {
          const url = new URL(exp)
          if (url && this.allImages.indexOf(exp) === -1 && url.protocol &&
            (url.protocol === 'http:' || url.protocol === 'https:')) {

            // Save the discovered image into the 'allImages' array
            this.allImages.push(exp)

            // object used to communicate with the extension popup
            const msg = { imgurl: exp }

            // Try to find links associated to this image, walking up and down
            // the DOM tree
            const link = findLinkUp(objList[img]) || findLinkDown(objList[img])
            // If found, save link
            if (link) {
              this.allLinks[this.allImages.length - 1] = link
              msg.imglink = link
            }

            // Notify the existence of a new image to the extension popup
            chrome.runtime.sendMessage(msg)
          }
        } catch (ex) {
          // Something bad has happened
          console.log(`Album extension: Error processing element ${img}:\n${exp} - ${ex}`)
        }
      })
      this.scanning = false
    },
    /**
     * Starts the scanning process as a daemon
     */
    startScanning: function () {
      if (this.scanProcess)
        this.endScanning()
      this.scanProcess = window.setInterval(() => this.scanImages(), this.SCAN_INTERVAL)
    },
    /**
     * Stops the scanning daemon
     */
    endScanning: function () {
      if (this.scanProcess) {
        window.clearInterval(this.scanProcess)
        this.scanProcess = null
      }
    },
    /**
     * Reports all the detected images, sending messages to the extension popup
     */
    listScannedImages: function () {
      this.reporting = true
      this.allImages.forEach((img, p) => {
        const obj = { imgurl: img };
        if (this.allLinks[p])
          obj.imglink = this.allLinks[p]
        chrome.runtime.sendMessage(obj)
      })
      this.reporting = false
    }
  };

  // UTILITY FUNCTIONS:

  /**
   * Array of objects already examined when searching for links
   * @type Object[]
   */
  const alreadyLooked = []

  /**
   * Walks up on the DOM tree searching for objects of type 'a' with 'href'
   * @param {HTMLElement} obj - The HTML element to check for. If it's not of the
   * desired type, the search will continue with its parent.
   */
  const findLinkUp = function (obj) {
    if (obj.nodeName.toLowerCase() === 'a') {
      if (obj.getAttribute('href'))
        return absoluteLink(obj)
    }
    if (alreadyLooked.indexOf(obj) === -1)
      alreadyLooked.push(obj)
    var parent = obj.parentElement
    return parent ? findLinkUp(parent) : null
  }

  /**
   * Walks down on the DOM tree searching for objects of type 'a' with 'href'
   * @param {HTMLElement} obj - The HTML element to check for. If it's not of the
   * desired type, the search will continue with its children.
   */
  const findLinkDown = function (obj) {
    if (obj.nodeName.toLowerCase() === 'a') {
      if (obj.getAttribute('href'))
        return absoluteLink(obj)
    }
    for (var i = 0; i < obj.children.length; i++) {
      var child = obj.children.item(i)
      if (child) {
        var link = findLinkDown(child)
        if (link)
          return link
      }
    }
    return null
  }

  /**
   * Builds a link with the absolute URL of the provided link
   * @param {URL} link
   * @returns {String}
   */
  const absoluteLink = link => link.protocol ? `${link.protocol}//${link.host}${link.pathname}${link.search}${link.hash}` : null
}

// MAIN:

// On the first execution, create an object of type '__ListImages' and assign it to
// the global variable '__listImagesObj'.
// Otherwise, if '__listImagesObj' already exists, report the detected images to
// the extension popup
if (typeof window.__listImagesObj === 'undefined')
  window.__listImagesObj = new window.__ListImages()
else
  window.__listImagesObj.listScannedImages()

// Instruct '__listImages' to start the scanning daemon
window.__listImagesObj.startScanning()
