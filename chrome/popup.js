
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
              $list.append($('<li class="ui-state-default ui-sortable-handle"/>')
                      .data('url', request.imgurl)
                      .append($lispan));
              $('#numImgs').html(++numImgs);
              $('#numSel').html(++numSelected);
            }
          });

  var copyAndNotify = function(txt){
    clipboard.copy(txt);    
    chrome.notifications.create({
      type: 'basic',
      title: chrome.i18n.getMessage('extName'),
      message: chrome.i18n.getMessage('msgDataCopied'),
      iconUrl: 'icons/icon.png'});    
  };

  $('#copyListBtn').click(function () {
    var txt = '';
    $('li').each(function (index) {
      if (selected[index])
        txt = txt + ($(this).data('url')) + '\n';
    });
    copyAndNotify(txt);
  });

  $('#copyHtmlBtn').click(function () {
    var txt = '';
    $('li').each(function (index) {
      if (selected[index])
        txt = txt + '<img src="' + ($(this).data('url')) + '">\n';
    });
    copyAndNotify(txt);
  });

  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
