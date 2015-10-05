# `.use()`

**Adds a new builder to the chain.**

It can be called in two ways.

## Passing a function

**Signature: `.use(fn: builder)`**

Here's a custom builder function that prepends a copyright banner to all CSS files:

```js
var exhibit = require('exhibit');

exhibit('src')
  .use(function (path, contents) {
    if (path.endsWith('.css')) {
      return '/* Copyright 2015 AwesomeCorp */\n' + content;
    }
    return contents;
  })
  .build('dist');
```

Or you might get your function from an external module:

```js
var exhibit = require('exhibit');
var babel = require('exhibit-builder-babel');

exhibit('src')
  .use(babel({stage: 1}))
  .build('dist');
```


## Auto-loading plugins

**Signature: `.use(string: pluginName, [...args])`**

Automatically requires the appropriate plugin for you:

```js
var exhibit = require('exhibit');

exhibit('src')
  .use('babel', {stage: 1})
  .build('dist');
```

The above is a shortcut for:

`.use(require('exhibit-builder-babel')({stage: 1}))`
