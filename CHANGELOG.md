### v2.0.2 (2022-11-09)
#### Breaking changes
- Refactoring Chrome extension for [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/):
  - `manifest.json` updated to version 3, using now a service worker instead of directly injecting code on the current tab.
  - Code has been split into two directories: `popup` and `sw`.
  - Communication between components via messages has been completely updated.
  - Extensive use of promises and asynchronous functions.
  - [jQuery](https://jquery.com/) is no longer needed. The pop-up has been refactorized using just vanilla javascript.

#### Improvements
  - Updated galleria script
  - Updated NPM components
  - Use of a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) instead of continuously scanning, looking for changes in the main document.

### v1.2.0 (2021-30-10)
#### Bug fixes
- Update the regexp used to set the desired picture width and height in Google Photos

### v1.1.0 for Microsoft Edge (2021-09-25)
#### Improvements
- Make the extension also available for Microsoft Edge

### v1.1.0 (2021-01-08)
#### Improvements
- All dependencies are now managed with `npm`, instead of Yarn.
- Updated [jQuery](https://www.npmjs.com/package/jquery) to 3.5.1.
- Updated [Material Design Lite](https://www.npmjs.com/package/material-design-lite) to 1.3.0.
- Since all major browsers support the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard), [Clipboard Polyfill](https://www.npmjs.com/package/clipboard-polyfill) is no longer used.
- Code syntax checked with [ESLint](https://eslint.org/)

### v1.0.12 (2019-05-19)
#### Improvements
- Make exported Galleria divs more responsive, using max-width instead of fixed width.
- Updated components to their latest versions: ([jQuery](https://jquery.com/) 3.4.1, [clipboard-polyfill](https://github.com/lgarron/clipboard-polyfill) 2.8.0, [MDL](https://getmdl.io/) 1.3.0, [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill) 0.5.0).


### v1.0.11 (2018-01-16)
#### Improvements
- Moving from [Bower](https://bower.io) to [Yarn](https://yarnpkg.com/) for tracking components
- Updated components to their latest versions: ([jQuery](https://jquery.com/) 3.2.1, [clipboard-polyfill](https://github.com/lgarron/clipboard-polyfill) 0.4.9, [MDL](https://getmdl.io/) 1.3.0, [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill) 0.4.9).
- Use of a [polyfill](https://github.com/lgarron/clipboard-polyfill) to write to the system clipboard, thanks to [Lucas Garron](https://github.com/lgarron).
- Code updated and optimized for ECMAScript 6 (ES6)

### v1.0.10 (2017-06-13)
#### Improvements
- Debug mode disabled in the Galleria.io HTML snippet. This prevents annoying messages displaying over the images when any error occurs.

### v1.0.9 (2017-06-12)
#### Improvements
- "Album" published on [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/photo-album/)

### v1.0.8 (2017-06-08)
#### Improvements
- "Album" works now with Mozilla Firefox thanks to the new [Web Extensions API](https://developer.mozilla.org/en-US/Add-ons/WebExtensions)

## Previous versions
Check the [Git log](https://github.com/projectestac/album/commits/master?after=ad9de151d0943788c660a4d49280482b0d20aa84+0)
