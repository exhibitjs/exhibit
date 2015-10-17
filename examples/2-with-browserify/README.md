# Demo: Exhibit with Browserify

1. `cd` into this directory
2. `npm install`
3. `node watch.js`

The site will open in your browser. Try editing files within `app`, and your changes should be reflected in your browser immediately. Notice that any console logs go right back to the original source files, thanks to source maps.

#### watch.js

To illustrate how Exhibit build sequences work, this demo uses a couple of preprocessing steps before Browserify.

```js
var exhibit = require('exhibit');

exhibit()
  .use('babel')
  .use('coffee')
  .use('browserify', 'main.js')
  .build('app', 'dist', {
    watch: true,
    serve: true,
    browserSync: true,
    open: true
  });
```

Explanation of sequence:

1. The [babel](https://github.com/exhibitjs/exhibit-builder-babel) plugin converts all `.js` files (which may be written in ES6) to ES5 JavaScript.
    - This converts any ES6 `import` statements to `require()` calls.

2. Next, the [coffee](https://github.com/exhibitjs/exhibit-builder-coffee) plugin converts any `.coffee` files to ES5 JavaScript, too.

3. Finally, the [browserify](https://github.com/exhibitjs/exhibit-builder-browserify) plugin looks for any `require()` calls in `main.js`, and bundles them into the file.
    - We’ve specified `main.js` as an entry, but the plugin has [more options](https://github.com/exhibitjs/exhibit-builder-browserify#options) this.
