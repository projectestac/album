# Album
http://projectestac.github.io/album

[![Available in the Chrome Web Store](https://raw.githubusercontent.com/projectestac/album/master/misc/chrome-store/ChromeWebStore_Badge_v2_206x58.png)](https://chrome.google.com/webstore/detail/album/obknigmaekkacdkckfeegcfiefdaeked)  [![Available in Firefox Add-Ons](https://raw.githubusercontent.com/projectestac/album/master/misc/firefox-addons/amo_badge.png)](https://addons.mozilla.org/firefox/addon/photo-album/)  [![Available in Microsoft Edge Add-Ons](https://raw.githubusercontent.com/projectestac/album/master/misc/microsoft-edge-store/edge-store-badge.png)](https://microsoftedge.microsoft.com/addons/detail/%C3%A0lbum/dldelfmgohfegmibjdpijkbdaedoddlg)

_Album_ is a browser extension that detects the images on the current page and shows them in a list that can be exported in three different formats:

* A simple **list** of absolute URLs pointing at the images.

* An HTML snippet with `img` tags forming a **mosaic**. Images can also export their original links.

* An HTML snippet that creates a **carousel** powered by [Galleria.io](http://galleria.io).

In all cases, the data is copied into the clipboard and can be inserted into any text editor by pressing `Ctrl+V`. Mosaic and carousel snippets can be inserted into documents, blog posts, virtual learning environments or any other application based on HTML content. Before pasting the code into a rich-text editor, be sure to set it in _plain text_ mode (usually represented by a button with the symbols `<>` or `html`).

This is a free software project. You can contribute to improving this browser extension by reporting [issues](https://github.com/projectestac/album/issues), translating it into other languages or sending [pull requests](https://github.com/projectestac/album/pulls). Thanks in advance!

_Album_ is currently implemented and tested for Chrome/Chromium, Edge and Firefox. It is currently published on the **[Chrome Web Store](https://chrome.google.com/webstore/detail/album/obknigmaekkacdkckfeegcfiefdaeked)**, **[Firefox Add-ons](https://addons.mozilla.org/ca/firefox/addon/photo-album/)** and **[Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/%C3%A0lbum/dldelfmgohfegmibjdpijkbdaedoddlg)**.

Special thanks to the excellent work done by **[Galleria.io](http://galleria.io)**, the open source engine beneath the image carousel. In addition to the basic free theme used by _Album_, they provide also with other nice and featured themes at cheap prices.

Note that _Album_ does not copy images nor any type of files: it just deals with URLs pointing at remote resources. Issues with the images (slow loading, _File not found_ errors...) are often related to problems with the origin of the images.

This project was developed in HTML5, CSS and JavaScript. It makes use of three open-source libraries:

* [JQuery](http://jquery.com) by The JQuery Foundation
* [Material Design Lite](https://www.getmdl.io) by Google

In browsers that don't currently support the [`<dialog>`](https://developer.mozilla.org/ca/docs/Web/HTML/Element/dialog) HTML element (like Firefox), this polyfill is also used:

* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill) by The Chromium Authors

All these components can be obtained with `npm`:

```bash
$ npm ci
```

Components will then be placed into `/node_modules` and referenced by symbolic links from `/chrome/lib` and `/firefox/lib`.

For more information on how to develop browser extensions, refer to:

- [Chrome Developers'](https://developer.chrome.com/extensions) site.

- [WebExtensions page on MDN](https://developer.mozilla.org/en-US/Add-ons/WebExtensions).

- [Develop extensions for Microsoft Edge](https://developer.microsoft.com/en-us/microsoft-edge/extensions/)
