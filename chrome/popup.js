
/* global chrome, clipboard */

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
  var MIN_WIDTH = 60, MIN_HEIGHT=60;
  
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
  $('#copyListBtn').html(chrome.i18n.getMessage('copyListBtn')).prop('title', chrome.i18n.getMessage('copyListBtnTooltip'));
  $('#copyHtmlBtn').html(chrome.i18n.getMessage('copyHtmlBtn')).prop('title', chrome.i18n.getMessage('copyHtmlBtnTooltip'));
  $('#copyScriptBtn').html(chrome.i18n.getMessage('copyScriptBtn')).prop('title', chrome.i18n.getMessage('copyScriptBtnTooltip'));

  /**
   * This button stops and restarts the scanning of images on main document
   */
  var stopBtnStatus = true;
  $('#stopBtn').html('stop').click(function () {
    if (stopBtnStatus) {
      chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
      $(this).button("option", {icons: {primary: 'ui-icon-play'}, label: 'run'});
      $('#activity').attr({src: 'icons/stopped-wheel.gif'});
      stopBtnStatus = false;
    }
    else {
      chrome.tabs.executeScript(null, {code: 'window.__listImages.startScanning();'});
      $(this).button("option", {icons: {primary: 'ui-icon-pause'}, label: 'stop'});
      $('#activity').attr({src: 'icons/rotating-wheel.gif'});
      stopBtnStatus = true;
    }
  }).button({icons: {primary: 'ui-icon-pause'}, label: 'stop'});

  var $imgDialog = $('<div title="'+chrome.i18n.getMessage('previewImage')+'"/>');
  var $imgDialogPreview = $('<img class="imgpreview">');
  $('.imgList').append($imgDialog.append($imgDialogPreview));
  $imgDialog.dialog({autoOpen: false});

  var $list = $('ul#list')
          .sortable({placeholder: "ui-state-highlight"})
          .disableSelection();

  chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {
            if (request.imgurl) {
              var n = numImgs;
              selected[n] = true;
              var $lispan = $('<span/>');
              
              var $checkBox = $('<input class="ui-state-default" type="checkbox" checked/>').change(function () {
                selected[n] = this.checked ? true : false;
                $('#numSel').html(updateNumSelected());
              });           
              $lispan.append($checkBox);
              
              var $img = $('<img class="imgcaption" src="' + request.imgurl + '"/>').load(function(){
                // Uncheck small images
                if($img.get(0).naturalWidth < MIN_WIDTH || $img.get(0).naturalHeight < MIN_HEIGHT){
                  $checkBox.prop('checked', false);
                  selected[n] = false;
                  $('#numSel').html(updateNumSelected());
                }                
              }).on('click', function(){
                if(!$imgDialog.dialog("isOpen")){
                  $imgDialogPreview.attr({src: this.src});
                  $imgDialog.dialog("open");
                }
              });
              $lispan.append($img);
              
              var $urlText = $('<span class="urltext">' + request.imgurl + '</span>');
              $lispan.append($urlText);
              
              var $li = $('<li class="ui-state-default ui-sortable-handle"/>')
                      .data('url', request.imgurl)
                      .append($lispan);
              if (request.imglink)
                $li.data('link', request.imglink);
              
              $list.append($li);
              $('#numImgs').html(++numImgs);
              $('#numSel').html(++numSelected);
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
    $('li').each(function (index) {
      if (selected[index]) {
        var txt = $(this).data('url');
        if (withImg)
          txt = '<img src="' + txt + '">';
        if (withLinks) {
          var link = $(this).data('link');
          if (link) {
            if(dataLink)
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

  $('#copyListBtn').button().click(function () {
    copyAndNotify(listImages(false, false, false));
  });

  $('#copyHtmlBtn').button().click(function () {
    copyAndNotify(listImages(true, true, false));
  });

  $('#copyScriptBtn').button().click(function () {
    // Gallery made with http://galleria.io/
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
  
  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
