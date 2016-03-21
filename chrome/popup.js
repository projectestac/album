
/* global chrome, clipboard */

// Load when the DOM is ready to be used
$(function () {

    $('#stopBtn').html('stop').click(function () {
        chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
    });

    var $list = $('ul#list')
            .sortable({placeholder: "ui-state-highlight"})
            .disableSelection();

    chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.imgurl) {
                    var $lispan = $('<span/>');
                    $lispan.append($('<input class="ui-state-default" type="checkbox" checked/>'));
                    $lispan.append($('<img class="imgcaption" src="' + request.imgurl + '"/>'));
                    $lispan.append($('<span class="urltext">' + request.imgurl + '</span>'));
                    $list.append($('<li class="ui-state-default ui-sortable-handle"/>')
                            .data('url', request.imgurl)
                            .append($lispan));
                }
            });

    $('#copyListBtn').html('copy').click(function () {
        var txt = '';
        $('li').each(function (index) {
            txt = txt + ($(this).data('url')) + '\n';
        });
        clipboard.copy(txt);
    });

    $('#copyHtmlBtn').html('copy').click(function () {
        var txt = '';
        $('li').each(function (index) {
            txt=txt + '<img src="' + ($(this).data('url')) + '">\n';
        });
        clipboard.copy(txt);
    });

    chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
