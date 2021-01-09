/**
 * File    : firefox/popup.js
 * Created : 20/03/2016
 * Updated:  10/05/2019
 * By      : Francesc Busquets
 *
 * Album (Firefox version)
 * Browser plugin that detects and lists the absolute URL of all images diplayed on the current tab
 * https://github.com/projectestac/album
 * (c) 2016-2021 Catalan Educational Telematic Network (XTEC)
 * This program is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, version. This
 * program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details. You should have received a copy of the GNU General
 * Public License along with this program. If not, see [http://www.gnu.org/licenses/].
 */

/* global $, browser, componentHandler, dialogPolyfill */

/**
 * Main script loads when DOM is ready to be used
 */
$(function () {

  // Register dialogs
  document.querySelectorAll('dialog').forEach(dlg => dialogPolyfill.registerDialog(dlg));

  /**
   * Adjust sizes in small screens
   */
  if (screen.availHeight < 600) {
    const height = '470px';
    $('html').css({ height: height, 'overflow-y': 'auto' });
    $('body').css({ height: height, 'max-height': height, 'min-height': height, 'overflow-y': 'auto' });
    $('.description').css({ width: '280px' });
    $('#imgTable tbody').css({ height: '270px' });
    $('#settingsDlg .mdl-dialog__content').css({ height: '390px', 'overflow-y': 'auto' });
    $('.dimInput').css({ width: '385px' });
  }

  /**
   * Number of images currently detected and selected
   * @type number
   */
  let numImgs = 0;
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
  ];

  /**
   * Variables frequently used, initialized with JQuery objects
   * @type $JQuery
   */
  const $table = $('#imgTable');
  const $tbody = $('#imgTableBody');
  const $numSel = $('#numSel');
  const $numImgs = $('#numImgs');

  /**
   * Updates the selected images counter
   * @returns {number}
   */
  const updateNumSelected = function () {
    numSelected = selected.reduce((n, sel) => n + (sel ? 1 : 0), 0);
    return numSelected;
  };

  /**
   * Localize main UI elements
   */
  $('#imgUrlLb').html(browser.i18n.getMessage('imgUrlLb'));
  $('.description').html(browser.i18n.getMessage('extDescText'));
  $('#listCaption').html(browser.i18n.getMessage('listBtn'));
  $('#listBtn').prop('title', browser.i18n.getMessage('listBtnTooltip'));
  $('#mosaicCaption').html(browser.i18n.getMessage('mosaicBtn'));
  $('#mosaicBtn').prop('title', browser.i18n.getMessage('mosaicBtnTooltip'));
  $('#galleriaCaption').html(browser.i18n.getMessage('galleriaBtn'));
  $('#galleriaBtn').prop('title', browser.i18n.getMessage('galleriaBtnTooltip'));
  $('#settingsBtn').prop('title', browser.i18n.getMessage('settingsBtnTooltip'));

  /**
   * Read current settings from browser.storage.sync
   */
  browser.storage.sync.get(DEFAULT_SETTINGS)
    .then(items => settings = { ...settings, ...items })
    .catch(err => console.log(`Album extension - Error retrieving user preferences: ${err}`));

  /**
   * This button stops and restarts image scanning on the main document
   */
  let stopBtnStatus = true;
  let stopBtnWaiting = false;
  $('#stopBtn')
    .prop('title', browser.i18n.getMessage('stopBtnTooltip'))
    .on('click', () => {
      if (!stopBtnWaiting) {
        stopBtnWaiting = true;
        if (stopBtnStatus)
          browser.tabs.executeScript({ code: 'window.__listImages.endScanning();' })
            .then((_result) => {
              $('#progressBar').removeClass('mdl-progress__indeterminate');
              $('#stopIcon').html('play_arrow');
              $('#stopBtn').prop('title', browser.i18n.getMessage('playBtnTooltip'));
              stopBtnStatus = false;
              stopBtnWaiting = false;
            })
            .catch(err => {
              console.log(`Album extension - Error while trying to stop the images detector: ${err}`);
              stopBtnWaiting = false;
            });
        else
          browser.tabs.executeScript({ code: 'window.__listImages.startScanning();' })
            .then(() => {
              $('#progressBar').addClass('mdl-progress__indeterminate');
              $('#stopIcon').html('pause');
              $('#stopBtn').prop('title', browser.i18n.getMessage('stopBtnTooltip'));
              stopBtnStatus = true;
              stopBtnWaiting = false;
            })
            .catch(err => {
              console.log(`Album extension - Error while trying to start the images detector: ${err}`);
              stopBtnWaiting = false;
            });
      }
    });

  /**
   * Localize and set action for the 'close' button in the preview dialog
   */
  $('#previewClose')
    .prop('title', browser.i18n.getMessage('Close'))
    .on('click', () => $('#previewDlg')[0].close());

  /**
   * Sets action for the global checkbox, located at the first column of the table header
   */
  $table
    .find('thead .mdl-data-table__select input')
    .on('change', event => {
      $tbody
        .find('.mdl-data-table__select')
        .get()
        .forEach((box, i) => {
          selected[i] = event.target.checked;
          box.MaterialCheckbox[event.target.checked ? 'check' : 'uncheck']();
        });
      $numSel.html(updateNumSelected());
    });

  /**
   * This function listens to messages sent by the 'listimages' script running
   * on the main page. Each message contains the data associated to one image
   */
  const msgListener = function (request /*, sender, sendResponse*/) {

    const { gpWidth, gpHeight } = settings;

    if (request.imgurl) {
      let url = request.imgurl;
      const n = numImgs;
      selected[n] = true;

      // Check if we are in Google Photos and request a specific size if needed
      if ((gpWidth || gpHeight) && /^https:\/\/[\w.]+\.googleusercontent\.com\//.test(url)) {
        const exp = `=${gpWidth ? `w${gpWidth}-` : ''}${gpHeight ? `h${gpHeight}-` : ''}no`;
        url = url.replace(/=(w\d+)?-?(h\d+)?(-[\w-+?&]*)?$/, exp);
      }
      // Check if this image falls in the category of unwanted
      else if (unwantedImages.some(uw => uw.test(url)))
        selected[n] = false;

      // Build a new <tr> element with the image URL as a data attribute
      const $tr = $('<tr/>');
      $tr.data('url', url);

      // Add a checkbox to $tr
      const $checkBox = $(`<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="row[${numImgs + 1}]"/>`)
        .append($(`<input type="checkbox" id="row[${numImgs + 1}]" class="mdl-checkbox__input" ${selected[n] ? 'checked' : ''}/>`)
          .on('change', event => {
            selected[n] = event.target.checked ? true : false;
            $numSel.html(updateNumSelected());
          }));
      $tr.append($('<td/>').append($checkBox));

      // Add an interactive image thumbnail to $tr
      const $img = $('<img class="thumb mdl-list__item-icon"/>')
        .attr({ src: url, title: url })
        .on('load', () => {
          // Images sized below MIN_WIDH x MIN_HEIGHT will be unchecked by default
          if ($img.get(0).naturalWidth < MIN_WIDTH || $img.get(0).naturalHeight < MIN_HEIGHT) {
            $checkBox[0].MaterialCheckbox.uncheck();
            selected[n] = false;
            $numSel.html(updateNumSelected());
          }
        })
        .on('click', () => {
          let img = $img.get(0);
          $('.infoSize').html((img &&
            typeof img.naturalWidth !== 'undefined' &&
            typeof img.naturalHeight !== 'undefined' &&
            img.naturalWidth > 0 &&
            img.naturalHeight > 0) ?
            img.naturalWidth + ' x ' + img.naturalHeight :
            browser.i18n.getMessage('unknownSize'));

          $('.previewImgUrl').attr({ href: url, title: url });
          $('.previewImgUrl .urltext').html(url);
          $('#previewImg').attr({ 'src': url });

          const link = request.imglink || '';
          $('.previewImgLink').attr({ href: link, title: link });
          $('.previewImgLink .urltext').html(link);
          $('#previewLink').css('visibility', request.imglink ? 'visible' : 'hidden');

          $('#previewDlg')[0].showModal();
        });
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($img));

      // Add the URL text to $tr
      const $urlText = $(`<span class="urltext">${url}</span>`);
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($urlText));

      // Add the image link to $tr, if any
      let $link = $('<span/>');
      if (request.imglink) {
        $link = $(`<a id="link[${numImgs + 1}]" class="urllink"/>`)
          .attr({ href: request.imglink, target: '_blank', title: request.imglink })
          .append($('<i class="material-icons"/>').html('link'));
        $tr.data('link', request.imglink);
      } else
        $link = $('');
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($link));

      // Add $tr to table body and refresh MDL components
      $tbody.append($tr);
      componentHandler.upgradeElements($table.get());

      // Update the image counter, resizing it if needed
      if (numImgs === 99) {
        $('.counter').css('width', '64px');
        $('.description').css('width', '270px');
      }
      $numImgs.html(++numImgs);
      if (selected[n])
        $numSel.html(++numSelected);
    }
  };

  /**
   * Builds a unique identifier, used in scripts to refer to the image container
   * (useful when multiple galleries will coexist in the same document)
   * @returns {String}
   */
  const getUniqueId = () => (65536 + Math.floor(Math.random() * 120000)).toString(16).toUpperCase();

  /**
   * Copies the provided text to the system clipboard and notifies the user about
   * the completion of the requested operation
   * @param {String} txt - The text to copy to the clipboard
   */
  const copyAndNotify = function (txt) {
    navigator.clipboard.writeText(txt || '')
      .then(() => {
        browser.notifications.create({
          type: 'basic',
          title: browser.i18n.getMessage('extName'),
          message: browser.i18n.getMessage('msgDataCopied'),
          iconUrl: 'icons/icon192.png',
        });
      });
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

    $tbody.find('tr').each(function (index) {
      if (selected[index]) {
        let txt = $(this).data('url');
        if (withImg)
          txt = `<img src="${txt}"${styleTag}>`;
        if (withLinks) {
          const link = $(this).data('link');
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
  $('#listBtn').on('click', () => copyAndNotify(listImages(false, false, false)));

  /**
   * Sets action for the 'mosaic' button
   */
  $('#mosaicBtn').on('click', () => {
    const { mosaicMaxWidth, mosaicMaxHeight, mosaicLinks, popupLinks } = settings;
    const imgStyle = (mosaicMaxWidth > 0 || mosaicMaxHeight > 0) ?
      (mosaicMaxWidth > 0 ? `max-width:${mosaicMaxWidth}px;` : '') +
      (mosaicMaxHeight > 0 ? `max-height:${mosaicMaxHeight}px;` : '') : null;
    copyAndNotify(listImages(true, mosaicLinks, false, popupLinks, imgStyle));
  });

  /**
   * Sets action for the 'galleria.io' button
   */
  $('#galleriaBtn')
    .on('click', () => {
      const { galWidth, galHeight, galLinks, popupLinks } = settings;
      const id = getUniqueId();
      const code = `
<div id="${id}" style="width:100%;max-width:${galWidth}px;height:${galHeight}px;display:none;">
${listImages(true, galLinks, galLinks)}</div>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
<script>
  (MyGalleries=(typeof MyGalleries === 'undefined' ? [] : MyGalleries)).push({gallId:'#${id}',autoplay:true,lightbox:true,debug:false,popupLinks:${popupLinks}});
  if(typeof GalleryLoaded === 'undefined'){
    GalleryLoaded = jQuery(function(){
      jQuery.ajax({url:'https://cdn.jsdelivr.net/npm/galleria@1.6.1/dist/galleria.min.js',dataType:'script',cache:true}).done(function(){
        Galleria.loadTheme('https://cdn.jsdelivr.net/npm/galleria@1.6.1/dist/themes/classic/galleria.classic.js');
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
    $('#galleriaLb').html(browser.i18n.getMessage('galleriaBtn'));
    $('#galWidthLb').html(browser.i18n.getMessage('galWidthLb'));
    $('#galHeightLb').html(browser.i18n.getMessage('galHeightLb'));
    $('.numeric').html(browser.i18n.getMessage('numberFormatWarning'));
    $('.hyperlinks').html(browser.i18n.getMessage('addHyperlinks'));
    $('#mosaicLb').html(browser.i18n.getMessage('mosaicBtn'));
    $('#mosaicMaxWidthLb').html(browser.i18n.getMessage('mosaicMaxWidthLb'));
    $('#mosaicMaxHeightLb').html(browser.i18n.getMessage('mosaicMaxHeightLb'));
    $('#gpLb').html(browser.i18n.getMessage('gpLb'));
    $('#gpWidthLb').html(browser.i18n.getMessage('gpWidthLb'));
    $('#gpHeightLb').html(browser.i18n.getMessage('gpHeightLb'));
    $('#popupLinksLb').html(browser.i18n.getMessage('popupLinks'));

    // Check if all numeric fields have a valid format
    const checkSettingsDlg = () => $('#settingsDlg').find('.is-invalid').length === 0;

    // Disables the 'OK' button when some field has a non valid format
    // (delaying the check with 'window.setTimeout' because the 'disabled' attribute
    // is set at the end of the 'onInput' event)
    $('#settingsDlg')
      .find('input')
      .on('input', () => window.setTimeout(() => $('#settingsOk').attr('disabled', !checkSettingsDlg()), 0));

    // Sets action for the 'OK' button
    $('#settingsOk')
      .html(browser.i18n.getMessage('OK'))
      .on('click', () => {
        if (checkSettingsDlg()) {

          // Collect data
          settings.galWidth = Number($('#galWidth').val()) || DEFAULT_SETTINGS.galWidth;
          settings.galHeight = Number($('#galHeight').val()) || DEFAULT_SETTINGS.galHeight;
          settings.galLinks = $('#galLinks').parent().hasClass('is-checked');
          settings.mosaicMaxWidth = Number($('#mosaicMaxWidth').val()) || DEFAULT_SETTINGS.mosaicMaxWidth;
          settings.mosaicMaxHeight = Number($('#mosaicMaxHeight').val()) || DEFAULT_SETTINGS.mosaicMaxHeight;
          settings.mosaicLinks = $('#mosaicLinks').parent().hasClass('is-checked');
          settings.gpWidth = Number($('#gpWidth').val()) || DEFAULT_SETTINGS.gpWidth;
          settings.gpHeight = Number($('#gpHeight').val()) || DEFAULT_SETTINGS.gpHeight;
          settings.popupLinks = $('#popupLinks').parent().hasClass('is-checked');

          // Close dialog
          $('#settingsDlg')[0].close();

          // Save values to persistent storage
          if (browser.storage && browser.storage.sync)
            browser.storage.sync.set(settings)
              .then(() => console.log('Album extension - User preferences saved'))
              .catch(err => console.log(`Album extension - Error saving user preferences: ${err}`));
        }
      });

    // Sets action for the 'cancel' button
    $('#settingsCancel')
      .html(browser.i18n.getMessage('Cancel'))
      .on('click', () => $('#settingsDlg')[0].close());

    settingsInitialized = true;
  };

  // Sets action for the 'settings' button
  $('#settingsBtn').on('click', () => {

    const {
      galWidth, galHeight, galLinks,
      mosaicMaxWidth, mosaicMaxHeight, mosaicLinks,
      gpWidth, gpHeight, popupLinks
    } = settings;

    // Check if settings dialog has been initialized
    if (!settingsInitialized)
      initSettings();

    // Load fields with values
    $('#galWidth').val(galWidth);
    $('#galHeight').val(galHeight);
    if (galLinks)
      $('#galLinks').parent().addClass('is-checked');
    else
      $('#galLinks').parent().removeClass('is-checked');

    $('#mosaicMaxWidth').val(mosaicMaxWidth);
    $('#mosaicMaxHeight').val(mosaicMaxHeight);
    if (mosaicLinks)
      $('#mosaicLinks').parent().addClass('is-checked');
    else
      $('#mosaicLinks').parent().removeClass('is-checked');

    $('#gpWidth').val(gpWidth);
    $('#gpHeight').val(gpHeight);

    if (popupLinks)
      $('#popupLinks').parent().addClass('is-checked');
    else
      $('#popupLinks').parent().removeClass('is-checked');

    $('#settingsDlg').find('.mdl-textfield').addClass('is-dirty');

    // Open dialog
    $('#settingsDlg')[0].showModal();
  });

  //
  // Main actions executed after all components have been initialized:
  // Enable the message listener, inject 'listimages.js' on the main document
  // remove the 'loading' curtain and... let's go!
  browser.runtime.onMessage.addListener(msgListener);
  browser.tabs.executeScript({ file: 'listimages.js' }).then(
    () => {
      $('.loading').remove();
      $('.mainContent').fadeIn();
    },
    err => console.log(`Album extension: Error executing script: ${err}`)
  );
});
