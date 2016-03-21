
/* global chrome */

// Load when the DOM is ready to be used
$(function () {

  $('#stopBtn').html('stop').click(function () {
    chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
  });
  
  var $list = $('ul#list');

  chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {
            if (request.imgurl) {
                var $lispan = $('<span/>');
                $lispan.append($('<input type="checkbox" checked/>'));
                $lispan.append($('<img class="imgcaption" src="'+request.imgurl+'"/>'));
                $lispan.append($('<span class="urltext">'+request.imgurl+'</span>'));
                $list.append($('<li/>').data('url', request.imgurl).append($lispan));
            }
          });
          
  $('#copyBtn').html('copy').click(function () {
      var txt='';
      $('li').each(function(index){
          txt=txt+($(this).data('url'))+ '\n';
      });
      clipboard.copy(txt);
  });
          
          
  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
