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
