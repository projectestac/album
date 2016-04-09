#Album
http://projectestac.github.io/album

_Album_ is a browser extension that detects the images on the current page and shows them in a list that can be exported in three different formats:

* A simple **list** of absolute URLs pointing at the images.

* An HTML snippet with `img` tags forming a **mosaic**. Images can also export their original links.

* An HTML snippet that creates a **carousel** powered by [Galleria.io](http://galleria.io).

In all cases, the data is copied into the clipboard and can be inserted into any text editor by pressing `Ctrl+V`. Mosaic and carousel snippets can be inserted into documents, blog posts, virtual learning environments or any other application based on HTML content. Before pasting the code into a rich-text editor, be sure to set it in _plain text_ mode (usually represented by a button with the symbols `<>` or `html`).

This is a free software project. You can contribute to improving this browser extension by reporting [issues](https://github.com/projectestac/album/issues), translating it into other languages or sending [pull requests](https://github.com/projectestac/album/pulls). Thanks in advance!

_Album_ is currently implemented for Chrome/Chromium and can be installed directly from the **[Chrome Web Store](https://chrome.google.com/webstore/detail/album/obknigmaekkacdkckfeegcfiefdaeked)**. We want to implement it also for **Mozilla Firefox** in the future (developers help wanted!)

Special thanks to the excellent work done by **[Galleria.io](http://galleria.io)**, the open source engine beneath the image carousel. In addition to the basic free theme used by _Album_, they provide also with other nice and featured themes at cheap prices.

Note that _Album_ does not copy images nor any type of files: it just deals with URLs pointing at remote resources. Issues with the images (slow loading, file not found...) are often related to problems with the origin of the images.

This project was developed in HTML5, CSS and JavaScript. It makes use of three open-source libraries:

* [JQuery](http://jquery.com) by The JQuery Foundation
* [clipboard.js](https://github.com/lgarron/clipboard.js) by Lucas Garron
* [Material Design Lite](https://www.getmdl.io) by Google

All these components can be obtained with [Bower](http://bower.io/). To download its latest releases install Bower on your system and launch `bower update` from the project's root folder. Components will then be placed into `/bower_components` and referenced by symbolic links from `/chrome/lib`.

For more information on how to build Chrome & Chromium extensions, refer to [Chrome Developers'](https://developer.chrome.com/extensions) site.

