
/* global chrome, clipboard, componentHandler */

/**
 * Loads when DOM is ready to be used
 */
$(function () {

  /**
   * Number of images currently detected
   * @type number
   */
  var numImgs = 0;

  /**
   * Number of images currently selected
   * @type number
   */
  var numSelected = 0;

  /**
   * Minimum width and height to auto-check images
   * @type number
   */
  var MIN_WIDTH = 60, MIN_HEIGHT = 60;

  /**
   * Array of boolean values indicating the 'selected' state of each image
   * @type number[]
   */
  var selected = [];

  /**
   * 
   * Updates the counter of images currently selected
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
  $('.description').html(chrome.i18n.getMessage('extDescText'));
  $('#numImgLb').html(chrome.i18n.getMessage('numImgLb'));
  $('#selImgLb').html(chrome.i18n.getMessage('selImgLb'));
  $('#copyListCaption').html(chrome.i18n.getMessage('copyListBtn'));
  $('#copyListBtn').prop('title', chrome.i18n.getMessage('copyListBtnTooltip'));
  $('#copyHtmlCaption').html(chrome.i18n.getMessage('copyHtmlBtn'));
  $('#copyHtmlBtn').prop('title', chrome.i18n.getMessage('copyHtmlBtnTooltip'));
  $('#copyScriptCaption').html(chrome.i18n.getMessage('copyScriptBtn'));
  $('#copyScriptBtn').prop('title', chrome.i18n.getMessage('copyScriptBtnTooltip'));

  /**
   * This button stops and restarts the scanning of images on main document
   */
  var stopBtnStatus = true;
  $('#stopBtn').click(function () {
    if (stopBtnStatus) {
      chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
      $('#spinner').removeClass('is-active');
      //$('#searchImg').attr({src: 'icons/search00.gif'});
      $('#stopIcon').html('play_arrow');
      $('#scanningLb').html('Scan stopped.');
      stopBtnStatus = false;
    } else {
      chrome.tabs.executeScript(null, {code: 'window.__listImages.startScanning();'});
      $('#spinner').addClass('is-active');
      //$('#searchImg').attr({src: 'icons/search.gif'});
      $('#stopIcon').html('pause');
      $('#scanningLb').html('Scanning...');
      stopBtnStatus = true;
    }
  });

  var $table = $('#imgListTable');
  var $tbody = $('#imgListTableBody');
  var $numSel = $('#numSel');
  var $numImgs = $('#numImgs');
  
   
  var $headerCheckBox=$table.find('thead .mdl-data-table__select input');
  $headerCheckBox.on('change', function(event){
    var boxes = $tbody.find('.mdl-data-table__select').get();
    var check = event.target.checked;
    for(var i=0; i<boxes.length; i++){
      selected[i] = check;
      if(check)
        boxes[i].MaterialCheckbox.check();
      else
        boxes[i].MaterialCheckbox.uncheck();
    }
    $numSel.html(updateNumSelected());
  });
  
  chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {
            if (request.imgurl) {
              var n = numImgs;
              selected[n] = true;

              var $tr = $('<tr/>');

              var $checkBox = $('<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="row[' + (numImgs + 1) + ']"/>')
                      .append($('<input type="checkbox" id="row[' + (numImgs + 1) + ']" class="mdl-checkbox__input" checked/>')
                      .change(function(){
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
                  console.log('unchecking '+$checkBox);
                  //$checkBox.prop('checked', false);
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
                $link=$('<a id="link[' + (numImgs + 1) + ']" class="urllink"/>')
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
          });

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

  $('#copyListBtn').click(function () {
    copyAndNotify(listImages(false, false, false));
  });

  $('#copyHtmlBtn').click(function () {
    copyAndNotify(listImages(true, true, false));
  });

  $('#copyScriptBtn').click(function () {

    // Gallery provided by http://galleria.io/
    var playerId = Math.floor(Math.random() * 100000).toString(16).toUpperCase();
    var width = 600, height = 400;
    copyAndNotify(
            '[raw]\n' +
            '<script type="text/javascript" src="https://cdn.jsdelivr.net/g/jquery@1.12.1,galleria@1.4.2(galleria.js)"></script>\n' +
            '<div id="' + playerId + '" style="width: ' + width + 'px; height: ' + height + 'px;">\n' +
            listImages(true, true, true) +
            '</div>\n' +
            '<script>\n' +
            'Galleria.loadTheme(\'https://cdn.jsdelivr.net/galleria/1.4.2/themes/classic/galleria.classic.js\');\n' +
            'Galleria.run(\'#' + playerId + '\', {\n' +
            ' autoplay: true,' +
            ' lightbox: true' +
            '});\n' +
            '</script>\n' +
            '[/raw]');
  });

  $('#previewClose').on('click', function () {
    $('#previewDlg')[0].close();
  });

  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
