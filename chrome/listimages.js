
/* global chrome */

var ListImages = function () {
    this.allImages = [];
    this.allLinks = [];
};

ListImages.prototype = {
    constructor: ListImages,
    allImages: null,
    allLinks: null,
    scanProcess: null,
    scanning: false,
    reporting: false,
    SCAN_INTERVAL: 1000,
    scanImages: function () {

        // Avoid re-entrant processing
        if (this.scanning || this.reporting)
            return;

        this.scanning = true;
        console.log('scanning...');

        var imgList = [];
        var objList = [];

        // Check `img` objects
        var obj = document.querySelectorAll('img');
        for (var n = 0; n < obj.length; n++) {
            if (obj[n].src){
                objList.push(obj[n]);
                imgList.push(obj[n].src);
            }
        }

        // Check all objects with `background-image` attribute
        obj = document.querySelectorAll('div[style*=background-image]');
        for (var n = 0; n < obj.length; n++) {
            var exp = window.getComputedStyle(obj[n]).getPropertyValue('background-image').trim();
            if (exp.toLowerCase().substring(0, 4) === 'url(') {
                exp = exp.substring(4, exp.length - 1).trim();
                // Remove enclosing quotes
                if ((exp.substring(0, 1) === '"' && exp.substring(exp.length - 1, exp.length) === '"') ||
                        (exp.substring(0, 1) === '\'' && exp.substring(exp.length - 1, exp.length) === '\'')) {
                    exp = exp.substring(1, exp.length - 1).trim();
                }
                imgList.push(exp);
                objList.push(obj[n]);
            }
        }

        // Filter invalid URLs
        for (var n = 0; n < imgList.length; n++) {
            try {
                var exp = imgList[n];
                var url = new URL(exp);
                if (url && this.allImages.indexOf(exp) === -1 && url.protocol &&
                        (url.protocol === 'http:' || url.protocol === 'https:')) {
                    this.allImages.push(exp);
                    var obj = {imgurl: exp};
                    var link = findLinkUp(objList[n]);
                    if(link===null)
                        link = findLinkDown(objList[n]);
                    if(link){
                        this.allLinks[this.allImages.length-1]=link;
                        obj.imglink = link;
                    }
                    
                    // Notify plugin
                    chrome.runtime.sendMessage(obj);
                }
            } catch (ex) {
                console.log('Error processing element ' + n + ':\n' + exp + ' - ' + ex);
            }
        }
        this.scanning = false;
    },
    startScanning: function () {
        if (this.scanProcess)
            this.endScanning();
        var thisObj = this;
        this.scanProcess = window.setInterval(function () {
            thisObj.scanImages();
        }, this.SCAN_INTERVAL);
    },
    endScanning: function () {
        if (this.scanProcess) {
            window.clearInterval(this.scanProcess);
            this.scanProcess = null;
            console.log('scanning stopped!');
        }
    },
    listScannedImages: function () {
        this.reporting = true;
        for (var i = 0; i < this.allImages.length; i++) {
            var obj = {imgurl: this.allImages[i]};
            if(this.allLinks[i])
                obj.imglink = this.allLinks[i];            
            chrome.runtime.sendMessage(obj);
        }
        this.reporting = false;
    }
};

var findLinkUp = function (obj) {
    if (obj.nodeName.toLowerCase === 'a') {
        console.log('Found "a" '+obj);
        var href = obj.getAttribute('href');
        if (href)
            return href;
    }
    var parent = obj.parentElement;
    return parent ? this.findLinkUp(parent) : null;
};

var findLinkDown = function (obj) {
    if (obj.nodeName.toLowerCase === 'a') {
        console.log('Found "a" '+obj);
        var href = obj.getAttribute('href');
        if (href)
            return href;
    }
    for (var i = 0; i < obj.children.length; i++) {
        var child = obj.children.item(i);
        if (child) {
            var link = findLinkDown(child);
            if (link)
                return link;
        }
    }
    return  null;
};


if (typeof window.__listImages === 'undefined')
    window.__listImages = new ListImages();
else
    window.__listImages.listScannedImages();

window.__listImages.startScanning();
