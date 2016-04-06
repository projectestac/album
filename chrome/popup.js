
/* global chrome, clipboard, componentHandler */

/**
 * Loads when DOM is ready to be used
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
  var mosaicMaxWidth = 600, mosaicMaxHeight = 600, mosaicLinks = true;

  /**
   * Variables initialized with JQuery objects frequently used
   * @type $JQuery
   */
  var $table = $('#imgTable'), $tbody = $('#imgTableBody');
  var $numSel = $('#numSel'), $numImgs = $('#numImgs');

  /**
   * 
   * Updates the counter of selected images
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
   * Applies locale strings to UI elements
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

  chrome.storage.sync.get(function (items) {
    if (items.hasOwnProperty('galWidth'))
      galWidth = Number(items.galWidth);
    if (items.hasOwnProperty('galHeight'))
      galHeight = Number(items.galHeight);
    if (items.hasOwnProperty('galLinks'))
      galLinks = (items.galLinks === 'true');
    if (items.hasOwnProperty('mosaicMaxWidth'))
      mosaicMaxWidth = Number(items.mosaicMaxWidth);
    if (items.hasOwnProperty('mosaicMaxHeight'))
      mosaicMaxHeight = Number(items.mosaicMaxHeight);
    if (items.hasOwnProperty('mosaicLinks'))
      mosaicLinks = (items.mosaicLinks === 'true');
  });

  /**
   * This button stops and restarts the scanning of images on main document
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



  $('#previewClose').prop('title', chrome.i18n.getMessage('Close')).click(function () {
    $('#previewDlg')[0].close();
  });

  var $headerCheckBox = $table.find('thead .mdl-data-table__select input');
  $headerCheckBox.on('change', function (event) {
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

  var msgListener = function (request, sender, sendResponse) {

    if (request.imgurl) {
      var n = numImgs;
      selected[n] = true;

      var $tr = $('<tr/>');

      var $checkBox = $('<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="row[' + (numImgs + 1) + ']"/>')
              .append($('<input type="checkbox" id="row[' + (numImgs + 1) + ']" class="mdl-checkbox__input" checked/>')
                      .change(function () {
                        selected[n] = this.checked ? true : false;
                        $numSel.html(updateNumSelected());
                      }));
      $tr.append($('<td/>').append($checkBox));

      var $img = $('<img class="mdl-list__item-icon"/>').attr({
        src: request.imgurl,
        title: request.imgurl
      }).load(function () {
        // Uncheck small images
        if ($img.get(0).naturalWidth < MIN_WIDTH || $img.get(0).naturalHeight < MIN_HEIGHT) {
          $checkBox[0].MaterialCheckbox.uncheck();
          selected[n] = false;
          $numSel.html(updateNumSelected());
        }
      }).on('click', function () {
        $('#previewLink').attr({'href': request.imgurl});
        $('#previewImg').attr({'src': request.imgurl});
        $('#previewDlg')[0].showModal();
      });
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($img));
      $tr.data('url', request.imgurl);

      var $urlText = $('<span class="urltext">' + request.imgurl + '</span>');
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($urlText));

      var $link = $('<span/>');
      if (request.imglink) {
        $link = $('<a id="link[' + (numImgs + 1) + ']" class="urllink"/>')
                .attr({href: request.imglink, target: '_blank', title: request.imglink})
                .append($('<i class="material-icons"/>').html('link'));
        $tr.data('link', request.imglink);
      } else
        $link = $('');
      $tr.append($('<td class="mdl-data-table__cell--non-numeric"/>').append($link));

      $tbody.append($tr);
      componentHandler.upgradeElements($table.get());

      $numImgs.html(++numImgs);
      $numSel.html(++numSelected);
    }
  };

  var getUniqueId = function(){
    return (65536 + Math.floor(Math.random() * 120000)).toString(16).toUpperCase();
  };

  var copyAndNotify = function (txt) {
    clipboard.copy(txt);
    chrome.notifications.create({
      type: 'basic',
      title: chrome.i18n.getMessage('extName'),
      message: chrome.i18n.getMessage('msgDataCopied'),
      iconUrl: 'icons/icon192.png'});
  };

  var listImages = function (withImg, withLinks, dataLink) {
    var result = '';
    $tbody.find('tr').each(function (index) {
      if (selected[index]) {
        var txt = $(this).data('url');
        if (withImg)
          txt = '<img src="' + txt + '">';
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

  $('#listBtn').click(function () {
    copyAndNotify(listImages(false, false, false));
  });

  $('#mosaicBtn').click(function () {
    var pre = '', post = '';
    if (mosaicMaxWidth || mosaicMaxHeight) {
      var id = getUniqueId();
      pre = '<style>.mosaic' + id + ' img {' +
              (mosaicMaxWidth ? 'max-width:' + mosaicMaxWidth + 'px;' : '') +
              (mosaicMaxHeight ? 'max-height:' + mosaicMaxHeight + 'px;' : '') +
              '}</style>\n<div class="mosaic' + id + '">\n';
      post = '</div>\n';
    }
    copyAndNotify(pre + listImages(true, mosaicLinks, false) + post);
  });

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
            '</script>\n');
  });
  
  var settingsArmed = false;
  var armSettings = function () {
    // Set literals
    $('#galleriaLb').html(chrome.i18n.getMessage('galleriaBtn'));
    $('#galWidthLb').html(chrome.i18n.getMessage('galWidthLb'));
    $('#galHeightLb').html(chrome.i18n.getMessage('galHeightLb'));
    $('.numeric').html(chrome.i18n.getMessage('numberFormatWarning'));
    $('.hyperlinks').html(chrome.i18n.getMessage('addHyperlinks'));
    $('#mosaicLb').html(chrome.i18n.getMessage('mosaicBtn'));
    $('#mosaicMaxWidthLb').html(chrome.i18n.getMessage('mosaicMaxWidthLb'));
    $('#mosaicMaxHeightLb').html(chrome.i18n.getMessage('mosaicMaxHeightLb'));

    var checkSettingsDlg = function () {
      return $('#settingsDlg').find('.is-invalid').length === 0;
    };

    $('#settingsDlg').find('input').on('input', function () {
      window.setTimeout(function () {
        $('#settingsOk').attr('disabled', !checkSettingsDlg());
      }, 0);
    });

    $('#settingsOk').html(chrome.i18n.getMessage('OK')).click(function () {
      if (checkSettingsDlg()) {
        galWidth = $('#galWidth').val();
        galHeight = $('#galHeight').val();
        galLinks = $('#galLinks')[0].checked;

        mosaicMaxWidth = $('#mosaicMaxWidth').val();
        mosaicMaxHeight = $('#mosaicMaxHeight').val();
        mosaicLinks = $('#mosaicLinks')[0].checked;

        $('#settingsDlg')[0].close();
        
        var currentOptions = {
          galWidth: galWidth,
          galHeight: galHeight,
          galLinks: galLinks,
          mosaicMaxWidth: mosaicMaxWidth,
          mosaicMaxHeight: mosaicMaxHeight,
          mosaicLinks: mosaicLinks
        };
        chrome.storage.sync.set(currentOptions);
      }
    });

    $('#settingsCancel').html(chrome.i18n.getMessage('Cancel')).click(function () {
      $('#settingsDlg')[0].close();
    });

    settingsArmed = true;
  };

  $('#settingsBtn').click(function () {
    if (!settingsArmed)
      armSettings();

    $('#galWidth').val(galWidth);
    $('#galHeight').val(galHeight);
    $('#galLinks').prop('checked', galLinks);

    $('#mosaicMaxWidth').val(mosaicMaxWidth);
    $('#mosaicMaxHeight').val(mosaicMaxHeight);
    $('#mosaicLinks').prop('checked', mosaicLinks);

    $('#settingsDlg').find('.mdl-textfield').addClass('is-dirty');
    $('#settingsDlg')[0].showModal();
  });
  
  chrome.runtime.onMessage.addListener(msgListener);
  chrome.tabs.executeScript(null, {file: 'listimages.js'});
});
