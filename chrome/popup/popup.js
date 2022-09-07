/**
 * File    : chrome/popup/popup.js
 * Created : 20/03/2016
 * Updated:  27/08/2022
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

/* global chrome, componentHandler */


/**
 * Number of images currently detected and selected
 * @type number
 */
let numImages = 0;
let numSelected = 0;

/**
 * By default, images below this size (in pixels) will not be checked
 * @type number
 */
const MIN_WIDTH = 93;
const MIN_HEIGHT = 60;

/**
 * Array of boolean values indicating the 'selected' state of each image
 * @type number[]
 */
let selected = [];

/**
 * Default settings for Mosaic and Gallery.io
 * @type object
 */
const DEFAULT_SETTINGS = {
  galWidth: 600,
  galHeight: 400,
  galLinks: true,
  mosaicMaxWidth: 800,
  mosaicMaxHeight: 400,
  mosaicLinks: true,
  gpWidth: 800,
  gpHeight: 600,
  popupLinks: true,
};

/**
 * Current settings
 * @type object
 */
let settings = { ...DEFAULT_SETTINGS };
chrome.storage.sync.get(Object.keys(settings), values => { settings = { ...settings, ...values }; });

/**
 * Current status of the 'start/stop' button
 * @type boolean
 */
let stopBtnStatus = true;

/**
 * Known sources of app images, usually not wanted.
 * Images with URLs matching this regular expressions will be unchecked
 * by default.
 * @type RegExp[]
 */
const unwantedImages = [
  /^https?:\/\/[\w-.]+\.gstatic\.com\//,
  /^https?:\/\/[\w-.]+\.yimg\.com\//,
  /^https?:\/\/[\w-.]+\.istockimg\.com\/static\//,
  /^https?:\/\/instagramstatic[\w-.]+\.akamaihd\.net\//,
  /doubleclick\.net/,
  /adsafeprotected\.com/,
  /insightexpressai\.com/,
  /adzerk\.net/,
];

function createElement(tagName, attributes = {}) {
  const element = document.createElement(tagName);
  return setAttributes(element, attributes);
}

function setAttributes(element, attributes = {}) {

  let elements = [];

  if (typeof element === 'string')
    elements = document.querySelectorAll(element);
  else if (!Array.isArray(element))
    elements = [element];
  else
    elements = element;

  elements.forEach(el => {
    if (typeof attributes === 'string')
      el.textContent = attributes;
    else if (typeof attributes === 'object')
      Object.entries(attributes).forEach(([k, v]) => {
        if (k === 'text')
          el.textContent = v;
        else if (k === 'className')
          el.className = v;
        else
          el.setAttribute(k, v);
      });
  });

  return elements[0];
}

function getInputValue(id) {
  const el = document.getElementById(id);
  if (el)
    return el.value;
  return null;
}

/**
 * Builds a unique identifier, used in scripts to refer to the image container
 * (useful when multiple galleries will coexist in the same document)
 * @returns {String}
 */
const getUniqueId = () => (65536 + Math.floor(Math.random() * 120000)).toString(16).toUpperCase();

// Execute when DOM content has been loaded
window.addEventListener('DOMContentLoaded', () => {

  /**
   * Variables frequently used
   * @type HTMLElement
   */
  const imgTable = document.getElementById('imgTable');
  const imgTableBody = document.getElementById('imgTableBody');
  const numSel = document.getElementById('numSel');
  const numImgs = document.getElementById('numImgs');
  const settingsDlg = document.getElementById('settingsDlg');
  const settingsOk = document.getElementById('settingsOk');
  const settingsCancel = document.getElementById('settingsCancel');

  const updateNumSelected = () => {
    numSelected = selected.reduce((n, sel) => n + (sel ? 1 : 0), 0);
    numSel.textContent = numSelected;
  };

  /**
   * Localize main UI elements
   */
  setAttributes('#imgUrlLb', chrome.i18n.getMessage('imgUrlLb'));
  setAttributes('.description', chrome.i18n.getMessage('extDescText'));
  setAttributes('#listCaption', chrome.i18n.getMessage('listBtn'));
  setAttributes('#listBtn', { title: chrome.i18n.getMessage('listBtnTooltip') });
  setAttributes('#mosaicCaption', chrome.i18n.getMessage('mosaicBtn'));
  setAttributes('#mosaicBtn', { title: chrome.i18n.getMessage('mosaicBtnTooltip') });
  setAttributes('#galleriaCaption', chrome.i18n.getMessage('galleriaBtn'));
  setAttributes('#galleriaBtn', { title: chrome.i18n.getMessage('galleriaBtnTooltip') });
  setAttributes('#settingsBtn', { title: chrome.i18n.getMessage('settingsBtnTooltip') });

  /**
   * This button stops and restarts image scanning on the main document
   */
  const stopBtn = document.getElementById('stopBtn');
  const stopIcon = document.getElementById('stopIcon');
  const progressBar = document.getElementById('progressBar');
  stopBtn.setAttribute('title', chrome.i18n.getMessage('stopBtnTooltip'));
  stopBtn.addEventListener('click', () => chrome.runtime.sendMessage({ message: stopBtnStatus ? 'stopScanning' : 'startScanning' })
    .then(response => {
      if (response.message !== 'OK')
        throw new Error(response);
      else {
        progressBar.classList[stopBtnStatus ? 'remove' : 'add']('mdl-progress__indeterminate');
        stopIcon.textContent = stopBtnStatus ? 'play_arrow' : 'pause';
        stopBtn.setAttribute('title', chrome.i18n.getMessage(stopBtnStatus ? 'playBtnTooltip' : 'stopBtnTooltip'));
        stopBtnStatus = !stopBtnStatus;
      }
    })
    .catch(err => console.error('Error processing stop/start button:', err))
  );

  /**
   * Localize and set action for the 'close' button in the preview dialog
   */
  const previewClose = document.getElementById('previewClose');
  const previewDlg = document.getElementById('previewDlg');
  const previewLink = document.getElementById('previewLink')

  previewClose.setAttribute('title', chrome.i18n.getMessage('Close'));
  previewClose.addEventListener('click', () => previewDlg.close());

  /**
   * Sets action for the global checkbox, located at the first column of the table header
   */
  const checkAll = imgTable.querySelector('thead .mdl-data-table__select input');
  checkAll.addEventListener('change', event => {
    imgTable.querySelectorAll('.mdl-data-table__select').forEach((box, i) => {
      selected[i] = event.target.checked;
      box.MaterialCheckbox[event.target.checked ? 'check' : 'uncheck']();
    });
    updateNumSelected();
  });

  /**
   * This function listens to messages sent by the background script running
   * on the main page. Each message contains the data associated to one image
   */
  const processImgData = (data) => {

    const { gpWidth, gpHeight } = settings;

    if (data.imgurl) {
      let url = data.imgurl;
      const n = numImages;
      // Images will be unselected by default
      selected[n] = false;

      // Check if we are in Google Photos and request a specific size if needed
      if ((gpWidth || gpHeight) && /^https:\/\/[\w.]+\.googleusercontent\.com\//.test(url)) {
        const exp = `=${gpWidth ? `w${gpWidth}-` : ''}${gpHeight ? `h${gpHeight}-` : ''}no`;
        url = url.replace(/=(w\d+)?-?(h\d+)?no/, exp);
      }

      // Build a new <tr> element with the image URL as a data attribute
      const tr = createElement('tr', { 'data-url': url });

      // Add a checkbox to $tr
      const checkBox = createElement('label', {
        for: `row[${numImages + 1}]`,
        className: 'mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select',
      });

      const attr = { type: 'checkbox', id: `row[${numImages + 1}]` };
      if (selected[n])
        attr.checked = '';
      const input = createElement('input', { ...attr, className: 'mdl-checkbox__input' });
      input.addEventListener('change', event => {
        selected[n] = event.target.checked ? true : false;
        updateNumSelected();
      });

      tr.appendChild(createElement('td'))
        .appendChild(checkBox)
        .appendChild(input);

      // Add an interactive image thumbnail to tr

      const img = createElement('img', { src: url, title: url, className: 'thumb mdl-list__item-icon' });
      img.addEventListener('load', () => {
        // Check only real imges, not blacklisted and of siz equal or above MIN_WIDTH and MIN__HEIGHT
        if (!unwantedImages.some(uw => uw.test(url))
          && img.naturalWidth >= MIN_WIDTH
          && img.naturalHeight >= MIN_HEIGHT) {
          checkBox.MaterialCheckbox.check();
          selected[n] = true;
          updateNumSelected();
        }
      });
      img.addEventListener('click', () => {
        setAttributes('.infoSize',
          (img?.naturalWidth > 0 && img?.naturalHeight > 0) ?
            `${img.naturalWidth} x ${img.naturalHeight}` :
            chrome.i18n.getMessage('unknownSize'));
        setAttributes('.previewImgUrl', { href: url, title: url });
        setAttributes('.previewImgUrl .urltext', url);
        setAttributes('#previewImg', { src: url });

        const link = data.imglink || '';
        setAttributes('.previewImgLink', { href: link, title: link });
        setAttributes('.previewImgLink .urltext', link);
        previewLink.style.visibility = link ? 'visible' : 'hidden';

        previewDlg.showModal();
      });

      tr.appendChild(createElement('td', { className: 'mdl-data-table__cell--non-numeric' }))
        .appendChild(img);

      // Add the URL text to $tr
      const urlText = createElement('span', { text: url, className: 'urltext' });
      tr.appendChild(createElement('td', { className: 'mdl-data-table__cell--non-numeric' }))
        .appendChild(urlText);

      // Add the image link to $tr, if any
      let linkEl = createElement('span');
      if (data.imglink) {
        linkEl = createElement('a', { id: `link[${numImages + 1}]`, href: data.imglink, target: '_blank', title: data.imglink, className: 'urllink' });
        linkEl.appendChild(createElement('i', { text: 'link', className: 'material-icons' }));
        setAttributes(tr, { 'data-link': data.imglink });
      }

      tr.appendChild(createElement('td', { className: 'mdl-data-table__cell--non-numeric' }))
        .appendChild(linkEl);

      // Add $tr to table body and refresh MDL components
      imgTableBody.appendChild(tr);
      componentHandler.upgradeElements(imgTable);

      // Update the image counter, resizing it if needed
      if (numImages === 99) {
        document.querySelector('.counter').style.width = '64px';
        document.querySelector('.description').style.width = '270px';
      }
      numImgs.textContent = ++numImages;
      if (selected[n])
        updateNumSelected();
    }
  };

  /**
   * Copies the provided text to the system clipboard and notifies the user about
   * the completion of the requested operation
   * @param {String} txt - The text to write into the clipboard
   */
  const copyAndNotify = function (txt) {
    navigator.clipboard.writeText(txt || '')
      .then(() => chrome.runtime.sendMessage({
        message: 'notify',
        messageTitle: chrome.i18n.getMessage('extName'),
        messageText: chrome.i18n.getMessage('msgDataCopied'),
        url: `data:text/html;base64,${btoa(txt || '')}`,
        buttonText: chrome.i18n.getMessage('previewWidget'),
        buttonIcon: 'preview.png',
      }));
  };

  /**
   * Builds a list with the URL of all the images currently selected
   * @param {boolean} withImg - Put the image URL into an `<img>` tag
   * @param {boolean} withLinks - Include also the link associated with each image, if any
   * @param {boolean} dataLink - Use a 'data-link' attribute (instead of 'a href') for the link
   * @param {boolean} targetBlank - Add `target = "_blank"` to links
   * @param {String} imgStyle - Optional style to be applied to the image tag
   * @returns {String} - The text with the requested list
   */
  const listImages = function (withImg, withLinks, dataLink, targetBlank, imgStyle) {
    let result = '';
    const styleTag = imgStyle ? ` style="${imgStyle}"` : '';
    const targetTag = targetBlank ? ' target="_blank"' : '';

    imgTableBody.querySelectorAll('tr').forEach((tr, index) => {
      if (selected[index]) {
        let txt = tr.dataset.url;
        if (withImg)
          txt = `<img src="${txt}"${styleTag}>`;
        if (withLinks) {
          const link = tr.dataset.link;
          if (link) {
            if (dataLink)
              txt = `${txt.slice(0, -1)} data-link="${link}">`;
            else
              txt = `<a href="${link}"${targetTag}>${txt}</a>`;
          }
        }
        result = `${result}${txt}\n`;
      }
    });
    return result;
  };

  /**
   * Sets action for the 'list' button
   */
  document.getElementById('listBtn').addEventListener('click', () => copyAndNotify(listImages(false, false, false)));

  /**
   * Sets action for the 'mosaic' button
   */
  document.getElementById('mosaicBtn').addEventListener('click', () => {
    const { mosaicMaxWidth, mosaicMaxHeight, mosaicLinks, popupLinks } = settings;
    const imgStyle = (mosaicMaxWidth > 0 || mosaicMaxHeight > 0) ?
      (mosaicMaxWidth > 0 ? `max-width:${mosaicMaxWidth}px;` : '') +
      (mosaicMaxHeight > 0 ? `max-height:${mosaicMaxHeight}px;` : '') : null;
    copyAndNotify(listImages(true, mosaicLinks, false, popupLinks, imgStyle));
  });

  /**
   * Sets action for the 'galleria.io' button
   */
  document.getElementById('galleriaBtn').addEventListener('click', () => {
    const { galWidth, galHeight, galLinks, popupLinks } = settings;
    const id = getUniqueId();
    const code = `
<div id="${id}" style="width:100%;max-width:${galWidth}px;height:${galHeight}px;display:none;">
${listImages(true, galLinks, galLinks)}</div>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js"></script>
<script>
  (MyGalleries=(typeof MyGalleries === 'undefined' ? [] : MyGalleries)).push({gallId:'#${id}',autoplay:true,lightbox:true,debug:false,popupLinks:${popupLinks}});
  if(typeof GalleryLoaded === 'undefined'){
    GalleryLoaded = jQuery(function(){
      jQuery.ajax({url:'https://cdnjs.cloudflare.com/ajax/libs/galleria/1.6.1/galleria.min.js',dataType:'script',cache:true}).done(function(){
        Galleria.loadTheme('https://cdnjs.cloudflare.com/ajax/libs/galleria/1.6.1/themes/classic/galleria.classic.js');
        for(var n in MyGalleries){
          Galleria.run(MyGalleries[n].gallId, MyGalleries[n]);
          jQuery(MyGalleries[n].gallId).css('display','block');
        }
      });
    });
  }
</script>`;
    copyAndNotify(code);
  });

  /**
   * Prepares the elements located on the settings dialog
   * (method detached from the global initialization process for performance reasons)
   */
  let settingsInitialized = false;
  const initSettings = function () {

    // Localize UI components
    setAttributes('#galleriaLb', chrome.i18n.getMessage('galleriaBtn'));
    setAttributes('#galWidthLb', chrome.i18n.getMessage('galWidthLb'));
    setAttributes('#galHeightLb', chrome.i18n.getMessage('galHeightLb'));
    setAttributes('.numeric', chrome.i18n.getMessage('numberFormatWarning'));
    setAttributes('.hyperlinks', chrome.i18n.getMessage('addHyperlinks'));
    setAttributes('#mosaicLb', chrome.i18n.getMessage('mosaicBtn'));
    setAttributes('#mosaicMaxWidthLb', chrome.i18n.getMessage('mosaicMaxWidthLb'));
    setAttributes('#mosaicMaxHeightLb', chrome.i18n.getMessage('mosaicMaxHeightLb'));
    setAttributes('#gpLb', chrome.i18n.getMessage('gpLb'));
    setAttributes('#gpWidthLb', chrome.i18n.getMessage('gpWidthLb'));
    setAttributes('#gpHeightLb', chrome.i18n.getMessage('gpHeightLb'));
    setAttributes('#popupLinksLb', chrome.i18n.getMessage('popupLinks'));

    // Check if all numeric fields have a valid format
    const checkSettingsDlg = () => settingsDlg.querySelectorAll('.is-invalid').length === 0;

    // Disables the 'OK' button when some field has a non valid format
    // (delaying the check with 'window.setTimeout' because the 'disabled' attribute
    // is set at the end of the 'onInput' event)
    settingsDlg.querySelectorAll('input')
      .forEach(el => el.addEventListener('input', () => settingsOk[checkSettingsDlg() ? 'removeAttribute' : 'setAttribute']('disabled', '')));

    // Sets action for the 'OK' button
    settingsOk.textContent = chrome.i18n.getMessage('OK');
    settingsOk.addEventListener('click', () => {
      if (checkSettingsDlg()) {
        // Collect data
        settings.galWidth = Number(getInputValue('galWidth')) || DEFAULT_SETTINGS.galWidth;
        settings.galHeight = Number(getInputValue('galHeight')) || DEFAULT_SETTINGS.galHeight;
        settings.galLinks = document.getElementById('galLinks').parentElement.classList.contains('is-checked');
        settings.mosaicMaxWidth = Number(getInputValue('mosaicMaxWidth')) || DEFAULT_SETTINGS.mosaicMaxWidth;
        settings.mosaicMaxHeight = Number(getInputValue('mosaicMaxHeight')) || DEFAULT_SETTINGS.mosaicMaxHeight;
        settings.mosaicLinks = document.getElementById('mosaicLinks').parentElement.classList.contains('is-checked');
        settings.gpWidth = Number(getInputValue('gpWidth')) || DEFAULT_SETTINGS.gpWidth;
        settings.gpHeight = Number(getInputValue('gpHeight')) || DEFAULT_SETTINGS.gpHeight;
        settings.popupLinks = document.getElementById('popupLinks').parentElement.classList.contains('is-checked');

        // Close dialog
        settingsDlg.close();

        // Save values into persistent storage
        chrome.storage.sync.set(settings);
      }
    });

    // Sets action for the 'cancel' button
    settingsCancel.textContent = chrome.i18n.getMessage('Cancel');
    settingsCancel.addEventListener('click', () => settingsDlg.close());

    settingsInitialized = true;
  };

  // Sets action for the 'settings' button
  document.getElementById('settingsBtn').addEventListener('click', () => {

    const {
      galWidth, galHeight, galLinks,
      mosaicMaxWidth, mosaicMaxHeight, mosaicLinks,
      gpWidth, gpHeight, popupLinks } = settings;

    // Check if settings dialog has been initialized
    if (!settingsInitialized)
      initSettings();

    // Load fields with values
    document.getElementById('galWidth').value = galWidth;
    document.getElementById('galHeight').value = galHeight;
    document.getElementById('galLinks').parentElement.classList[galLinks ? 'add' : 'remove']('is-checked');
    document.getElementById('mosaicMaxWidth').value = mosaicMaxWidth;
    document.getElementById('mosaicMaxHeight').value = mosaicMaxHeight;
    document.getElementById('mosaicLinks').parentElement.classList[mosaicLinks ? 'add' : 'remove']('is-checked');
    document.getElementById('gpWidth').value = gpWidth;
    document.getElementById('gpHeight').value = gpHeight;
    document.getElementById('popupLinks').parentElement.classList[popupLinks ? 'add' : 'remove']('is-checked');
    settingsDlg.querySelectorAll('.mdl-textfield').forEach(el => el.classList.add('is-dirty'));

    // Open dialog
    settingsDlg.showModal();
  });

  // Send the start message to the worker, remove the "loading" curtain and... let's go!
  document.querySelector('.loading').style.display = 'none';
  document.querySelector('.mainContent').style.display = 'block';
  chrome.runtime.sendMessage({ message: 'init' })
    .then(response => {
      if (response.message === 'OK')
        window.setInterval(() => {
          chrome.runtime.sendMessage({ message: 'getImages' })
            .then(response => {
              if (response.message === 'OK')
                response.result.forEach(processImgData);
            });
        }, 1000);
    });
});
