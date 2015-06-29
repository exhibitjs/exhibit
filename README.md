# Exhibit.js

> Incremental, whole-app build pipelines (ALPHA)

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]


## Overview

Exhibit streams the contents of one directory into another, transforming them on the fly.

It's inspired by Yeoman and Brunch, but reconceived as a library with an Express-like API:

```js
exhibit('folder-a')
  .use(babel())
  .use(sass())
  .use(autoprefixer())
  .build('folder-b', {watch: true});
```

The `{watch: true}` option tells Exhibit to continue watching the source directory and **incrementally** rebuild files when they change. There are no temp files and it's *fast*.


## Demo

Until better docs exist, here is a [demo repo](https://github.com/exhibitjs/demo) to show how Exhibit can be used to build a simple front-end app.


## Building

The first argument to `.build()` is the destination path. An empty dir will be created here if necessary.

The optional second argument is an options object with these properties:

- `watch` – watch the source directory and rebuild things incrementally when files change. (Omit this if you just want to build and then exit.)

- `serve` – serve up the destination directory using Connect.

- `browserSync` – wires your built app up with BrowserSync so you get live-reloading pages when you edit files.

- `open` – open the site in your browser (this option only works in conjunction with `serve`).

- `verbose` – print out a **lot** of extra info about what's going in and out of each plugin.

(Shortcut: you can pass `true` instead of an options object – this enables the options `watch`, `serve`, `browserSync` and `open`. This is a typical set of options for hacking on a frontend app. You can also pass an object after that to further adjust the options.)

The `.build()` method returns a promise, so you can get notified when it's done using `.build('folder-b').then(function (changes) {...});`. (NB. 'done' means all files have been built – note that if `watch` is enabled, Exhibit will continue watching and rebuilding even after this promise resolves, until you exit the process or call `stop()`.)

## Load paths

If you have third-party components in other directories, you can tell Exhibit about them like this:

```js
exhibit('folder-a', 'bower_components', 'moar_components' /* etc */)
  .use(sass())
  .use(coffee())
  .build('folder-b');
```

- The first argument to `exhibit` is your app's source directory, which is what gets built.
- Subsequent arguments are extra load paths that will be made available for plugins to import from.


## Plugins

So far:

- [sass](https://github.com/exhibitjs/exhibit-sass) – compiles SCSS files with node-sass
- [babel](https://github.com/exhibitjs/exhibit-babel) – compiles JS files with Babel
- [coffee](https://github.com/exhibitjs/exhibit-coffee) – compiles CoffeeScript files
- [include-assets](https://github.com/exhibitjs/exhibit-include-assets) – checks your `<script>` or `<link rel="stylesheet">` tags and imports any missing files from your load paths
- [concat](https://github.com/exhibitjs/exhibit-concat) – concatenate adjacent scripts/stylesheets and update the corresponding HTML tags
- [uglify](https://github.com/exhibitjs/exhibit-uglify) – minify JavaScript
- clean-css (coming soon)
- browserify (coming soon)
- inline (coming soon)

[Open an issue](https://github.com/callumlocke/exhibit/issues) if you want to request a plugin.


### Loading plugins automatically

If you've installed `exhibit-*` modules in your `package.json`, you can load them all in one go, like this:

```js
var exhibit = require('exhibit');
var $ = exhibit.plugins();

exhibit('folder-a')
  .use($.sass())
  .use($.coffee())
  .build('dist', {watch: true});
```

### Writing a plugin

Plugins are functions that take in a path and contents, and return one or more files. You can write them inline like this:

```js
exhibit('folder-a')
  .use(function (path, contents) {
    // add a copyright banner to the top of all CSS files
    if (/\.css$/.test(path)) {
      contents = '/* Copyright 2015 Me */\n\n' + contents;
    }

    return contents;
  });
```


#### More advanced plugins

> 🐝 All this will be explained better in real authoring/publishing docs, soon.

- Async stuff: just return a promise that resolves with the 'real' return value.

- If you encounter an error in whatever you're building, just throw or reject.

- Importing other files: use `this.import(path)`. This returns a promise that resolves with an object containing `path` (the resolved file path – might be different from what you requested) and `contents` (a buffer). Using `this.import()` instead of `fs` to import files has a few benefits:
  1. It allows Exhibit to keep track of inter-file dependencies so it can automate incremental rebuilds and deletions correctly.
  2. It allows you to import files that may have already been modified by a 
  3. It will automatically defer to the load paths if it's not found.

- Outputting multiple/other paths: instead of returning the contents directly, return an object with file paths as keys and buffers/strings as contents.

- Preventing anything being output for the given path: just return `null` or `undefined`.


## Licence

MIT


<!-- badge URLs -->
[npm-url]: https://npmjs.org/package/exhibit
[npm-image]: https://img.shields.io/npm/v/exhibit.svg?style=flat-square

[travis-url]: http://travis-ci.org/exhibitjs/exhibit
[travis-image]: https://img.shields.io/travis/exhibitjs/exhibit.svg?style=flat-square

[depstat-url]: https://david-dm.org/exhibitjs/exhibit
[depstat-image]: https://img.shields.io/david/exhibitjs/exhibit.svg?style=flat-square
