# Exhibit.js (alpha)

> Incremental, whole-app build pipelines. Intended mainly for static sites and SPAs.

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

```sh
$ npm install exhibit
```


## Overview

Exhibit sets up an incremental flow of files from one directory to another, via composable transformation plugins.

It's not an overbearing CLI tool. It's just a regular Node library with a very simple API:

```js
var exhibit = require('exhibit');

exhibit('folder-a')
  .use(babel())
  .use(sass())
  .use(autoprefixer())
  .build('folder-b', {watch: true});
```

It handles inter-file dependencies automatically. It does the minimal work on each rebuild. It involves no temp files, and it's *fast*.


## Demo

Until proper docs exist, here is a [demo repo](https://github.com/exhibitjs/demo) to show how Exhibit can be used to build a simple front-end app.


## Building

The first argument to `.build()` is the destination path. An empty dir will be created here if necessary.

The optional second argument is an options object with these boolean properties:

- `watch` – watches the source directory and rebuilds files incrementally when they change. (Omit this if you just want to build and then exit.)

- `serve` – serves up the destination directory using Connect.

- `browserSync` – wires everything up with BrowserSync so you get live-reloading pages whenever changes are written.

- `open` – opens the site in your browser (this option only works in conjunction with `serve`).

- `verbose` – prints out a **lot** of extra info about what's going in and out of each plugin.

(Shortcut: you can pass `true` instead of an options object – this enables the four options `watch`, `serve`, `browserSync` and `open` all at once. This is a typical configuration for hacking on a frontend app.)

### Callbacks?

The `.build()` method returns a promise, so if you want to be notified when it's done: `.build('folder-b').then(function (changes) {...});`. (NB. 'done' means all files have been built – note that if `watch` is enabled, Exhibit will continue watching and rebuilding even after this promise resolves, until you exit the process or call `stop()`.)

## Load paths

If you have third-party components in other directories, you can tell Exhibit about them like this:

```js
exhibit('folder-a', 'bower_components', 'moar_components' /* etc */)
  .use(sass())
  .use(coffee())
  .build('folder-b');
```

- The first argument to `exhibit` is your app's source directory, which is what gets built.
- Any subsequent arguments are taken as extra load paths that will be made available for plugins to import from.


## Plugins

So far:

- [browserify](https://github.com/exhibitjs/exhibit-browserify) - bundles scripts with [Browserify](http://browserify.org/)
- [sass](https://github.com/exhibitjs/exhibit-sass) – compiles SCSS files with node-sass
- [babel](https://github.com/exhibitjs/exhibit-babel) – compiles JS files with Babel
- [coffee](https://github.com/exhibitjs/exhibit-coffee) – compiles CoffeeScript files
- [include-assets](https://github.com/exhibitjs/exhibit-include-assets) – checks your `<script>` or `<link rel="stylesheet">` tags and imports any missing files from your load paths
- [concat](https://github.com/exhibitjs/exhibit-concat) – concatenate adjacent scripts/stylesheets and update the corresponding HTML tags
- [uglify](https://github.com/exhibitjs/exhibit-uglify) – minify JavaScript
- clean-css (coming soon)
- inline (coming soon)

[Open an issue](https://github.com/exhibitjs/exhibit/issues) if you want to request a plugin.


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

> 🐝 All this will be explained better in proper authoring/publishing docs, soon.

- Async stuff: just return a promise that resolves with the 'real' return value.

- If you encounter an error in whatever you're building, just throw or reject. Exhibit will catch and present the error.

- Importing other files: use `this.import(path)`. This returns a promise that resolves with an object containing `path` (the resolved file path – might be different from what you requested) and `contents` (a buffer). Using `this.import()` instead of `fs` to import files has a few benefits:
  1. It allows Exhibit to keep track of inter-file dependencies so it can automate incremental rebuilds and deletions correctly.
  2. It allows you to import files that may have already been modified by a previous plugin.
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
