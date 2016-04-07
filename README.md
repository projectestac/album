# Album
https://github.com/projectestac/album

Browser plugin, currently implemented only for Chrome/Chromium, that detects and lists the absolute URL of all images diplayed on the current tab.

The list of detected images can be retrieved in different formats:

* A simple **list** of absolute URLs pointing to the images.

* An HTML snippet with `img` tags displaying a **mosaic** with the selected images. The `img` tags can be sourronded by `a href` tags pointing to the link associated to each image, if any.

* An HTML snippet that creates an **slideshow** powered by [galleria.io](http://galleria.io). The slideshow can also contain links associated to images.

In all cases, the data is copied to the clipboard. You can paste it using `Ctrl+V` into your text editor and use it in HTML documents, blog posts, virtual learning environments, etc.
Before pasting the code in these platforms, be sure to set the rich-text editor in _plain text_ mode.

_Album_ is a free software project created by the [ICT in Education Unit of the Catalan Ministry of Education](https://github.com/projectestac). You can contribute to improve this plugin reporting [issues](https://github.com/projectestac/album/issues) or sending [pull requests](https://github.com/projectestac/album/pulls). Thanks in advance!

We want to specially thank the excellent work done by the **[Galleria.io](http://galleria.io)** project that provides the engine beneath the image carousel. In addition to the basic free theme used by _Àlbum_, they provide very nice and improved themes at cheap prices.

Note that _Àlbum_ does not copy images nor any type or files: it just deals with URLs pointing to remote resources. Issues with these images (slow loading, not found...) are often related to problems with the origin of the images, and not to _Àlbum_.

This project was developed in HTML5, CSS and JavaScript. It makes use of three open-source libraries:

* [JQuery](http://jquery.com) by The JQuery Foundation
* [clipboard.js](https://github.com/lgarron/clipboard.js) by Lucas Garron
* [Material Design Lite](https://www.getmdl.io) by Google

All these components are obtained with [Bower](http://bower.io/). To download the latest releases just install Bower and launch `bower update` from the project's root folder. Components will then be placed into `/bower_components`, and referenced by symbolic links from `/chrome/lib`.

