# Bookmarks

## Build

have [npm][1] installed

have [bower][a], [gulp][b], [browserify][c] installed, so

```
npm install -g bower gulp browserify
```

fetch and scaffold the external dependencies ([d3][2], [bootstrap][3], [ionicons][4])

```
bower install
gulp bower
```

bundle using browserify for browser

have [chrome][5] installed

navigate to `chrome://extensions`

check developer mode

click `load unpacked extension`, choose the project folder

start bookmarking

[1]: https://www.npmjs.com/
[2]: https://d3js.org/
[3]: http://getbootstrap.com/
[4]: http://ionicons.com/
[5]: https://www.google.com/chrome/browser/desktop/index.html
[a]: https://bower.io/
[b]: http://gulpjs.com/
[c]: http://browserify.org/