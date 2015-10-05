# Writing a builder

> This document explains how to write a builder inline. See also: [publishing guidelines](./publishing-guidelines.md).

A builder is just a function. It's what's passed to `.use()`.

It deals with **one file at a time** (although it may import other files as part of this process) and returns whatever it wants to output to the next build step (or the destination directory, if it's the last builder).


## Simple example

```js
.use(function (path, contents) {
  // path is a string (an absolute path to the file)
  // contents is a buffer.

  // prepend a bannder if it's a CSS file
  if (path.endsWith('.css')) {
    return '/* Copyright 2015 AwesomeCorp */\n' + content;
  }

  // 
  return contents;
})
```


## Arguments

- `path` (string) – the absolute path to the file.
  + NB. this should be considered a 'virtual' path – it's possible the file was actually created by another builder earlier in the chain.
- `contents` (buffer) – the contents of the file.


## What should you return?

You should return whatever you want to output in respect of this file. 

Returning a string or buffer is just a shortcut for outputting contents to the same path that came in. In many cases, you might want to output to a different path, or multiple paths, depending on the nature of your builder.

For example, here's a builder for an imaginary preprocessing language called Foo, which compiles to CSS makes a source map:

```js
.use(function (path, contents) {
  if (path.endsWith('.foo')) {
    var compiled = foo(contents);

    var result = {};
    var cssPath = path.replace(/foo$/, 'css');
    result[cssPath] = compiled.css;
    result[cssPath + '.map'] = compiled.map;
    return result;
  }

  return contents; // other files
})
```


## Async

Async is easy: just return a promise and resolve it with your actual results.


## Advanced builders: importing other files

> docs coming soon.


## Utility belt

Exhibit exposes a handful of popular utility libraries to builders via `this.util`, for convenience.

For example, in a builder function, `this.util.micromatch` is micromatch.

- `lodash` aka `_`
- `bluebird` aka `Promise`
- `sander` aka `fs`
- `subdir`
- `micromatch`
- `SourceError`
- `convertSourceMap`
- `combineSourceMap`
