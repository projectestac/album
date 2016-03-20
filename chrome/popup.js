
/* global chrome */

// Load when the DOM is ready to be used
$(function () {

  $('#stopBtn').html('stop').click(function () {
    chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
  });

  chrome.runtime.onMessage.addListener(
          function (request, sender, sendResponse) {
            if (request.imgurl) {
              var txt = $('textarea#list');
              txt.val(txt.val() + request.imgurl + '\n');
            }
          });

  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
