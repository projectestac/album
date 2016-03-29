
/* global chrome, clipboard */

// Load when the DOM is ready to be used
$(function () {

  var numImgs = 0;
  var numSelected = 0;
  var selected = [];

  var updateNumSelected = function () {
    var result = 0;
    for (var i = 0; i < numImgs; i++)
      if (selected[i])
        result++;
    numSelected = result;
    return result;
  };

  $('.description').html(chrome.i18n.getMessage('extDescText'));
  $('#numImgLb').html(chrome.i18n.getMessage('numImgLb'));
  $('#selImgLb').html(chrome.i18n.getMessage('selImgLb'));
  $('#copyListBtn').html(chrome.i18n.getMessage('copyListBtn')).prop('title', chrome.i18n.getMessage('copyListBtnTooltip'));
  $('#copyHtmlBtn').html(chrome.i18n.getMessage('copyHtmlBtn')).prop('title', chrome.i18n.getMessage('copyHtmlBtnTooltip'));
  $('#copyScriptBtn').html(chrome.i18n.getMessage('copyScriptBtn')).prop('title', chrome.i18n.getMessage('copyScriptBtnTooltip'));

  $('#stopBtn').html('stop').click(function () {
    chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
  });

  var $list = $('ul#list')
          .sortable({placeholder: "ui-state-highlight"})
          .disableSelection();

  chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {
            if (request.imgurl) {
              var n = numImgs;
              selected[n] = true;
              var $lispan = $('<span/>');
              $lispan.append($('<input class="ui-state-default" type="checkbox" checked/>').change(function () {
                selected[n] = this.checked ? true : false;
                $('#numSel').html(updateNumSelected());
              }));
              $lispan.append($('<img class="imgcaption" src="' + request.imgurl + '"/>'));
              $lispan.append($('<span class="urltext">' + request.imgurl + '</span>'));
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

  $('#copyListBtn').click(function () {
    copyAndNotify(listImages(false, false, false));
  });

  $('#copyHtmlBtn').click(function () {
    copyAndNotify(listImages(true, true, false));
  });

  $('#copyScriptBtn').click(function () {

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
            //'  width: ' + width + ', height:' + height + '\n'+
            '});\n' +
            '</script>\n' +
            '[/raw]');
  });

  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
