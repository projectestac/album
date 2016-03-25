
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
  
  /**
   * Not used
   * 
  $('#stopBtn').html('stop').click(function () {
    chrome.tabs.executeScript(null, {code: 'window.__listImages.endScanning();'});
  });
  */

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

  var copyAndNotify = function (txt) {
    clipboard.copy(txt);
    chrome.notifications.create({
      type: 'basic',
      title: chrome.i18n.getMessage('extName'),
      message: chrome.i18n.getMessage('msgDataCopied'),
      iconUrl: 'icons/icon192.png'});
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

  // See 'slideshow.js' in /misc
  var slideShowCode = 'function createSlideShow(){for(var i=jQuery,e=i(\'<div id="slideshow"/>\').css({display:"block",width:"fit-content",margin:"auto"}),t=\'<svg fill="#222222" width="24" height="24" viewBox="0 0 24 24">\',d=i(\'<div id="ssPrevBtn">\').css({display:"inline-block","vertical-align":"middle"}).html(t+\'<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>\'),s=i(\'<div id="ssNextBtn">\').css({display:"inline-block","vertical-align":"middle"}).html(t+\'<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>\'),a=i(\'<div id="ssSlides"/>\').css({display:"inline-block","vertical-align":"middle",position:"relative",padding:"10px","box-shadow":"0 0 20px rgba(0,0,0,0.4)",width:slideShowOptions.width,height:slideShowOptions.height}),n="10px",l=0;l<slideShowOptions.pics.length;l++){var o=i("<div/>").css({position:"absolute",top:n,left:n,right:n,bottom:n}).append(i(\'<img src="\'+slideShowOptions.pics[l]+\'"/>\').css({position:"absolute",top:0,bottom:0,left:0,right:0,"max-width":"100%","max-height":"100%",margin:"auto"}));l>0&&o.hide(),a.append(o)}i("#"+slideShowOptions.playerid).append(e.append(d).append(a).append(s));var p=function(i){jQuery("#ssSlides > div:first").fadeOut(i).next().fadeIn(i).end().appendTo("#ssSlides")},c=function(i){jQuery("#ssSlides > div:first").fadeOut(i).nextAll().last().prependTo("#ssSlides").fadeIn(i)},r=0,h=function(i){r&&(window.clearInterval(r),r=0),i&&(r=window.setInterval(p,3e3))};d.on("click",function(){h(!1),c(0)}),s.on("click",function(){h(!1),p(0)}),slideShowOptions.autoplay&&h(!0)}if(document.writeln(\'<div id="\'+slideShowOptions.playerid+\'"/>\'),"undefined"==typeof jQuery){var headTag=document.getElementsByTagName("head")[0],jqTag=document.createElement("script");jqTag.type="text/javascript",jqTag.src="//ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js",jqTag.onload=createSlideShow,headTag.appendChild(jqTag)}else createSlideShow();';

  $('#copyScriptBtn').click(function () {
    var txt = '[raw]\n<script type="text/javascript">\n' +
            'var slideShowOptions = {\n' +
            'autoplay: true,\n' +
            'width: \'420px\',\n' +
            'height: \'267px\',\n' +
            'playerid: \''+ Math.floor(Math.random()*100000) +'\',\n' +
            'pics: [\n';
    var first = true;
    $('li').each(function (index) {
      if (selected[index]){
        if(!first)
          txt = txt + ',\n';
        else
          first = false;
        txt = txt + '\'' + $(this).data('url') + '\'';
      }
    });
    txt = txt + ']};\n' + slideShowCode + '\n</script>\n[/raw]';
    copyAndNotify(txt);
  });

  chrome.tabs.executeScript(null, {file: 'listimages.js'});

});
