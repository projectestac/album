/**
 * File    : chrome/popup.js  
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

/* global chrome, clipboard, componentHandler */

/**
 * Main script loads when DOM is ready to be used
 */
$(function () {

  /**
   * Number of images currently detected and selected
   * @type number
   */
  var numImgs = 0, numSelected = 0;

  /**
   * By default, images below this size (in pixels) will not be checked
   * @type number
   */
  var MIN_WIDTH = 60, MIN_HEIGHT = 60;

  /**
   * Array of boolean values indicating the 'selected' state of each image
   * @type number[]
   */
  var selected = [];

  /**
   * Default settings for Mosaic and Gallery.io
   * @type Number|boolean
   */
  var galWidth = 600, galHeight = 400, galLinks = true;
  var mosaicMaxWidth = 800, mosaicMaxHeight = 400, mosaicLinks = true;
  var rawTag = false;

  /**
   * Variables frequently used, initialized with JQuery objects
   * @type $JQuery
   */
  var $table = $('#imgTable'), $tbody = $('#imgTableBody');
  var $numSel = $('#numSel'), $numImgs = $('#numImgs');

  /**
   * Updates the selected images counter
   * @returns {number}
   */
  var updateNumSelected = function () {
    var result = 0;
    for (var i = 0; i < numImgs; i++)
      if (selected[i])
        result++;
    numSelected = result;
    return result;
  };

  /**
   * Localize main UI elements
   */
  $('#imgUrlLb').html(chrome.i18n.getMessage('imgUrlLb'));
  $('.description').html(chrome.i18n.getMessage('extDescText'));
  $('#listCaption').html(chrome.i18n.getMessage('listBtn'));
  $('#listBtn').prop('title', chrome.i18n.getMessage('listBtnTooltip'));
  $('#mosaicCaption').html(chrome.i18n.getMessage('mosaicBtn'));
  $('#mosaicBtn').prop('title', chrome.i18n.getMessage('mosaicBtnTooltip'));
  $('#galleriaCaption').html(chrome.i18n.getMessage('galleriaBtn'));
  $('#galleriaBtn').prop('title', chrome.i18n.getMessage('galleriaBtnTooltip'));
  $('#settingsBtn').prop('title', chrome.i18n.getMessage('settingsBtnTooltip'));

  /**
   * Read current settings from chrome.storage.sync
   */
  chrome.storage.sync.get(function (items) {
    if (items.hasOwnProperty('galWidth'))
      galWidth = Number(items.galWidth);
    if (items.hasOwnProperty('galHeight'))
      galHeight = Number(items.galHeight);
    if (items.hasOwnProperty('galLinks'))
      galLinks = (items.galLinks.toString() === 'true');
    if (items.hasOwnProperty('mosaicMaxWidth'))
      mosaicMaxWidth = Number(items.mosaicMaxWidth);
    if (items.hasOwnProperty('mosaicMaxHeight'))
      mosaicMaxHeight = Number(items.mosaicMaxHeight);
    if (items.hasOwnProperty('mosaicLinks'))
      mosaicLinks = (items.mosaicLinks.toString() === 'true');
    if (items.hasOwnProperty('rawTag'))
      rawTag = (items.rawTag.toString() === 'true');
  });

  /**
   * This button stops and restarts image scanning on the main document
   */
  var stopBtnStatus = true;
  $('#stopBtn').prop('title', chrome.i18n.getMessage('stopBtnTooltip')).click(function () {
    if (stopBtnStatus) {
      chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
      $('#progressBar').removeClass('mdl-progress__indeterminate');
      $('#stopIcon').html('play_arrow');
      $('#stopBtn').prop('title', chrome.i18n.getMessage('playBtnTooltip'));
      stopBtnStatus = false;
    } else {
      chrome.tabs.executeScript(null, {code: 'window.__listImages.startScanning();'});
      $('#progressBar').addClass('mdl-progress__indeterminate');
      $('#stopIcon').html('pause');
      $('#stopBtn').prop('title', chrome.i18n.getMessage('stopBtnTooltip'));
      stopBtnStatus = true;
    }
  });

  /**
   * Localize and set action for the 'close' button in the preview dialog
   */
  $('#previewClose').prop('title', chrome.i18n.getMessage('Close')).click(function () {
    $('#previewDlg')[0].close();
  });

  /**
   * Sets action for the global checkbox, located at the first column of the table header
   */
  $table.find('thead .mdl-data-table__select input').on('change', function (event) {
    var boxes = $tbody.find('.mdl-data-table__select').get();
    var check = event.target.checked;
    for (var i = 0; i < boxes.length; i++) {
      selected[i] = check;
      if (check)
        boxes[i].MaterialCheckbox.check();
      else
        boxes[i].MaterialCheckbox.uncheck();
    }
    $numSel.html(updateNumSelected());
  });

  /**
   * This function listens to messages sent by the 'listimages' script running
   * on the main page. Each message contains the data associated to one image
   */
  var msgListener = function (request /*, sender, sendResponse*/) {

    if (request.imgurl) {
      var n = numImgs;
      selected[n] = true;

      // Build a new <tr> element with the image URL as a data attribute
      var $tr = $('<tr/>');
      $tr.data('url', request.imgurl);

      // Add a checkbox to $tr
      var $checkBox = $('<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="row[' + (numImgs + 1) + ']"/>')
              .append($('<input type="checkbox" id="row[' + (numImgs + 1) + ']" class="mdl-checkbox__input" checked/>')
                      .change(function () {
                        selected[n] = this.checked ? true : false;
                        $numSel.html(updateNumSelected());
                      }));
      $tr.append($('<td/>').append($checkBox));

      // Add an interactive image thumbnail to $tr
      var $img = $('<img class="mdl-list__item-icon"/>').attr({
        src: request.imgurl,
        title: request.imgurl
      }).load(function () {
        // Don't default check images sized below MIN_WIDH x MIN_HEIGHT
        if ($img.get(0).naturalWidth < MIN_WIDTH || $img.get(0).naturalHeight < MIN_HEIGHT) {
          $checkBox[0].MaterialCheckbox.uncheck();
          selected[n] = false;
          $numSel.html(updateNumSelected());
        }
      }).on('click', function () {
        $('.previewImgUrl').attr({href: request.imgurl, title: request.imgurl});
        $('.previewImgUrl .urltext').html(request.imgurl);
        $('#previewImg').attr({'src': request.imgurl});

        var link = request.imglink ? request.imglink : '';
        $('.previewImgLink').attr({href: link, title: link});
        $('.previewImgLink .urltext').html(link);
        $('#previewLink').css('visibility', request.imglink ? 'visible' : 'hidden');

        $('#previewDlg')[0].showModal();
      });
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($img));

      // Add the URL text to $tr
      var $urlText = $('<span class="urltext">' + request.imgurl + '</span>');
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($urlText));

      // Add the image link to $tr, if any
      var $link = $('<span/>');
      if (request.imglink) {
        $link = $('<a id="link[' + (numImgs + 1) + ']" class="urllink"/>')
                .attr({href: request.imglink, target: '_blank', title: request.imglink})
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
      $numSel.html(++numSelected);
    }
  };

  /**
   * Builds a unique identifier, used in scripts to refer to the image container
   * (useful when multiple galleries will coexist in the same document)
   * @returns {String}
   */
  var getUniqueId = function () {
    return (65536 + Math.floor(Math.random() * 120000)).toString(16).toUpperCase();
  };

  /**
   * Copies the provided text to the system clipboard and notifies the user about
   * the completion of the requested operation
   * @param {String} txt - The text to copy to the clipboard
   */
  var copyAndNotify = function (txt, raw) {
    if(raw)
      txt='[raw]\n'+txt+'[/raw]\n';
    clipboard.copy(txt);
    chrome.notifications.create({
      type: 'basic',
      title: chrome.i18n.getMessage('extName'),
      message: chrome.i18n.getMessage('msgDataCopied'),
      iconUrl: 'icons/icon192.png'});
  };

  /**
   * Builds a list with the URL of all the images currently selected
   * @param {boolean} withImg - Put the image URL into an `<img>` tag
   * @param {boolean} withLinks - Include also the link associated with each image, if any
   * @param {boolean} dataLink - Use a 'data-link' attribute (instead of 'a href') for the link
   * @returns {String} - The text with the requested list
   */
  var listImages = function (withImg, withLinks, dataLink, imgStyle) {
    var result = '';
    var styleTag = imgStyle ? ' style="' + imgStyle + '"' : '';

    $tbody.find('tr').each(function (index) {
      if (selected[index]) {
        var txt = $(this).data('url');
        if (withImg) {
          txt = '<img src="' + txt + '"' + styleTag + '>';
        }
        if (withLinks) {
          var link = $(this).data('link');
          if (link) {
            if (dataLink)
              txt = txt.slice(0, -1) + ' data-link="' + link + '">';
            else
              txt = '<a href="' + link + '">' + txt + '</a>';
          }
        }
        result = result + txt + '\n';
      }
    });
    return result;
  };


  /**
   * Sets action for the 'list' button
   */
  $('#listBtn').click(function () {
    copyAndNotify(listImages(false, false, false));
  });

  /**
   * Sets action for the 'mosaic' button
   */
  $('#mosaicBtn').click(function () {
    var imgStyle = (mosaicMaxWidth > 0 || mosaicMaxHeight > 0) ?
            (mosaicMaxWidth > 0 ? 'max-width:' + mosaicMaxWidth + 'px;' : '') +
            (mosaicMaxHeight > 0 ? 'max-height:' + mosaicMaxHeight + 'px;' : '') : null;
    copyAndNotify(listImages(true, mosaicLinks, false, imgStyle), rawTag);
  });

  /**
   * Sets action for the 'galleria.io' button
   */
  $('#galleriaBtn').click(function () {
    var id = getUniqueId();
    copyAndNotify(
            '<script type="text/javascript" src="https://cdn.jsdelivr.net/g/jquery@1.12.1,galleria@1.4.2(galleria.js)"></script>\n' +
            '<div id="' + id + '" style="width: ' + galWidth + 'px; height: ' + galHeight + 'px;">\n' +
            listImages(true, galLinks, galLinks) +
            '</div>\n' +
            '<script>\n' +
            'Galleria.loadTheme(\'https://cdn.jsdelivr.net/galleria/1.4.2/themes/classic/galleria.classic.js\');\n' +
            'Galleria.run(\'#' + id + '\', {\n' +
            ' autoplay: true,' +
            ' lightbox: true' +
            '});\n' +
            '</script>\n', rawTag);
  });

  /**
   * Prepares the elements located on the settings dialog
   * (method detached from the global initialization process for performance reasons)
   */
  var settingsInitialized = false;
  var initSettings = function () {

    // Localize UI components
    $('#galleriaLb').html(chrome.i18n.getMessage('galleriaBtn'));
    $('#galWidthLb').html(chrome.i18n.getMessage('galWidthLb'));
    $('#galHeightLb').html(chrome.i18n.getMessage('galHeightLb'));
    $('.numeric').html(chrome.i18n.getMessage('numberFormatWarning'));
    $('.hyperlinks').html(chrome.i18n.getMessage('addHyperlinks'));
    $('#mosaicLb').html(chrome.i18n.getMessage('mosaicBtn'));
    $('#mosaicMaxWidthLb').html(chrome.i18n.getMessage('mosaicMaxWidthLb'));
    $('#mosaicMaxHeightLb').html(chrome.i18n.getMessage('mosaicMaxHeightLb'));
    $('#rawTagLb').html(chrome.i18n.getMessage('rawTag'));

    // Check if all numeric fields have a valid format
    var checkSettingsDlg = function () {
      return $('#settingsDlg').find('.is-invalid').length === 0;
    };

    // Disables the 'OK' button when some field has a non valid format
    // (delaying the check with 'window.setTimeout' because the 'disabled' attribute
    // is set at the end of the 'onInput' event)
    $('#settingsDlg').find('input').on('input', function () {
      window.setTimeout(function () {
        $('#settingsOk').attr('disabled', !checkSettingsDlg());
      }, 0);
    });

    // Sets action for the 'OK' button
    $('#settingsOk').html(chrome.i18n.getMessage('OK')).click(function () {
      if (checkSettingsDlg()) {

        // Collect data
        galWidth = $('#galWidth').val();
        galHeight = $('#galHeight').val();
        galLinks = $('#galLinks').parent().hasClass('is-checked');
        mosaicMaxWidth = $('#mosaicMaxWidth').val();
        mosaicMaxHeight = $('#mosaicMaxHeight').val();
        mosaicLinks = $('#mosaicLinks').parent().hasClass('is-checked');
        rawTag = $('#rawTag').parent().hasClass('is-checked');

        // Close dialog
        $('#settingsDlg')[0].close();

        // Save values to persistent storage
        chrome.storage.sync.set({
          galWidth: galWidth,
          galHeight: galHeight,
          galLinks: galLinks,
          mosaicMaxWidth: mosaicMaxWidth,
          mosaicMaxHeight: mosaicMaxHeight,
          mosaicLinks: mosaicLinks,
          rawTag: rawTag
        });
      }
    });

    // Sets action for the 'cancel' button
    $('#settingsCancel').html(chrome.i18n.getMessage('Cancel')).click(function () {
      $('#settingsDlg')[0].close();
    });

    settingsInitialized = true;
  };

  // Sets action for the 'settings' button
  $('#settingsBtn').click(function () {

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

    if (rawTag)
      $('#rawTag').parent().addClass('is-checked');
    else
      $('#rawTag').parent().removeClass('is-checked');

    $('#settingsDlg').find('.mdl-textfield').addClass('is-dirty');

    // Open dialog
    $('#settingsDlg')[0].showModal();
  });

  // 
  // Main actions executed after all components have been initialized:
  // Enable the message listener, inject 'listimages.js' on the main document
  // remove the 'loading' curtain and... let's go!
  chrome.runtime.onMessage.addListener(msgListener);
  chrome.tabs.executeScript(null, {file: 'listimages.js'});
  $('.loading').remove();
  $('.mainContent').fadeIn();
});
