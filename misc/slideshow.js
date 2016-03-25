
/* global createSlideShow */

var slideShowOptions = {
  autoplay: true,
  width: '420px',
  height: '267px',
  playerid: 'ABK643DF6HGT75',
  pics: [
    'https://c1.staticflickr.com/2/1522/25385960824_177a47ccc6.jpg',
    'https://c6.staticflickr.com/2/1606/25402148453_e9c6ba4358.jpg',
    'https://c7.staticflickr.com/2/1494/25902064462_f7d51d940b.jpg',
    'https://c3.staticflickr.com/2/1648/25904404762_f6e5389a8a.jpg',
    'https://c6.staticflickr.com/2/1677/25388438213_3b2a88ffeb.jpg',
    'https://c5.staticflickr.com/2/1478/25726442620_b15994f4f0.jpg',
    'https://c2.staticflickr.com/2/1525/25406947393_85295f5438.jpg',
    'https://c2.staticflickr.com/2/1598/25392668433_b02e39139f.jpg',
    'https://c2.staticflickr.com/2/1460/25403299273_4b734c0f12_n.jpg',
    'https://c7.staticflickr.com/2/1710/25385064054_ee9e5c2f44.jpg',
    'https://c7.staticflickr.com/2/1591/25387730854_ddd697beed.jpg',
    'https://c3.staticflickr.com/2/1674/25990754226_118531ff05.jpg',
    'https://c5.staticflickr.com/2/1681/25911930372_3191166281.jpg',
    'https://c1.staticflickr.com/2/1556/25733376120_a115c53e89.jpg',
    'https://c8.staticflickr.com/2/1489/25404327143_a1f08a91ef.jpg',
    'https://c5.staticflickr.com/2/1485/25915053772_5cef5511ae_n.jpg',
    'https://c3.staticflickr.com/2/1465/25400945274_d397f2deb8.jpg',
    'https://c8.staticflickr.com/2/1499/25410688703_4a68f99e74.jpg',
    'https://c7.staticflickr.com/2/1517/25726820790_d557794815_n.jpg',
    'https://c6.staticflickr.com/2/1592/25930036101_b20820cc71_m.jpg',
    'https://c3.staticflickr.com/2/1647/25906582762_5d121c9bb8_z.jpg',
    'https://c1.staticflickr.com/2/1553/25402905024_28c1e6a78f_z.jpg',
    'https://c3.staticflickr.com/2/1621/25403880354_f2f77c49f8.jpg',
    'https://c7.staticflickr.com/2/1501/25905176862_9860d463d8.jpg',
    'https://c1.staticflickr.com/2/1475/25900035312_03f6d81779.jpg',
    'https://c7.staticflickr.com/2/1672/25387528414_a1aedca8ff.jpg',
    'https://c7.staticflickr.com/2/1525/25726083030_fdf1bedaf5.jpg',
    'https://c4.staticflickr.com/2/1619/25396179123_b79aabb46f_z.jpg',
    'https://c8.staticflickr.com/2/1530/25398477583_4dea41dc3e.jpg',
    'https://c6.staticflickr.com/2/1597/25393581493_bc00b50810_z.jpg',
    'https://c1.staticflickr.com/2/1614/25906554432_84187224b0_n.jpg',
    'https://c6.staticflickr.com/2/1605/25403410333_46ffe6f27d_n.jpg',
    'https://c5.staticflickr.com/2/1703/25734542660_2779be2273.jpg',
    'https://c7.staticflickr.com/2/1606/25719325150_9dabeda95a.jpg',
    'https://c4.staticflickr.com/2/1498/25413117283_e24a10d5d6.jpg',
    'https://c8.staticflickr.com/2/1521/25395735223_740bba87fe.jpg',
    'https://c7.staticflickr.com/2/1465/25913540462_1be5d775f5.jpg',
    'https://c6.staticflickr.com/2/1483/25395524893_51289d0e30.jpg',
    'https://c7.staticflickr.com/2/1491/25409331534_49672fe60c.jpg',
    'https://c3.staticflickr.com/2/1714/25900809522_73165cb371_n.jpg',
    'https://c2.staticflickr.com/2/1705/25391602313_d48854e158.jpg',
    'https://c3.staticflickr.com/2/1602/25387091034_81ff8a9906.jpg',
    'https://c1.staticflickr.com/2/1475/25725372840_34a691b67c_z.jpg',
    'https://c1.staticflickr.com/2/1641/25907067792_74a534af03.jpg',
    'https://c6.staticflickr.com/2/1480/25408023773_429c5532e3.jpg',
    'https://c5.staticflickr.com/2/1513/25912234652_f94f999901_n.jpg',
    'https://c3.staticflickr.com/2/1591/25719799930_6e70462b13.jpg'
  ]
};

document.writeln('<div id="' + slideShowOptions.playerid + '"/>');

function createSlideShow() {
  var $ = jQuery;
  var $slideShow = $('<div id="slideshow"/>').css({display: 'block', width: 'fit-content', margin: 'auto'});
  var svgBase = '<svg fill="#222222" width="24" height="24" viewBox="0 0 24 24">';
  var $prevBtn = $('<div id="ssPrevBtn">').css({display: 'inline-block', 'vertical-align': 'middle'})
          .html(svgBase + '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>');
  var $nextBtn = $('<div id="ssNextBtn">').css({display: 'inline-block', 'vertical-align': 'middle'})
          .html(svgBase + '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>');
  var $slides = $('<div id="ssSlides"/>').css({display: 'inline-block', 'vertical-align': 'middle',
    position: 'relative', padding: '10px', 'box-shadow': '0 0 20px rgba(0,0,0,0.4)',
    width: slideShowOptions.width,
    height: slideShowOptions.height
  });
  var m = '10px';
  for (var i = 0; i < slideShowOptions.pics.length; i++) {
    var $imgDiv = $('<div/>')
            .css({position: 'absolute', top: m, left: m, right: m, bottom: m})
            .append($('<img src="' + slideShowOptions.pics[i] + '"/>')
                    .css({position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, 'max-width': '100%', 'max-height': '100%', margin: 'auto'}));

    if (i > 0)
      $imgDiv.hide();

    $slides.append($imgDiv);
  }
  $('#' + slideShowOptions.playerid).append($slideShow.append($prevBtn).append($slides).append($nextBtn));

  var nextSlide = function (duration) {
    jQuery('#ssSlides > div:first')
            .fadeOut(duration)
            .next()
            .fadeIn(duration)
            .end()
            .appendTo('#ssSlides');
  };

  var prevSlide = function (duration) {
    jQuery('#ssSlides > div:first')
            .fadeOut(duration)
            .nextAll()
            .last()
            .prependTo('#ssSlides')
            .fadeIn(duration);
  };

  var autoPass = 0;
  var autoRun = function (bEnable) {
    if (autoPass) {
      window.clearInterval(autoPass);
      autoPass = 0;
    }
    if (bEnable)
      autoPass = window.setInterval(nextSlide, 3000);
  };

  $prevBtn.on('click', function (e) {
    autoRun(false);
    prevSlide(0);
  });
  $nextBtn.on('click', function (e) {
    autoRun(false);
    nextSlide(0);
  });

  if (slideShowOptions.autoplay)
    autoRun(true);
}
;

// Check JQuery
if (typeof jQuery === 'undefined') {
  var headTag = document.getElementsByTagName("head")[0];
  var jqTag = document.createElement('script');
  jqTag.type = 'text/javascript';
  jqTag.src = '//ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js';
  jqTag.onload = createSlideShow;
  headTag.appendChild(jqTag);
} else {
  createSlideShow();
}