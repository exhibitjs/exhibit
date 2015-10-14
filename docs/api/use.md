# .use()

**Adds a new builder to the sequence.**

This method has three possible signatures.


### 1. Auto-load a plugin module

**Signature: `.use(string: pluginName, [...args])`**

Automatically imports the appropriate builder plugin for you, and calls it (along with any extra arguments you provide) to retrieve a configured builder function:

```js
exhibit()
  .use('babel', {stage: 1})
  .build('src', 'dist');
```

> Understand: the above snippet is really just a shortcut for this:
> 
> ```js
> exhibit()
>   .use( require('exhibit-builder-babel')({stage: 1}) )
>   .build('src', 'dist');
> ```


### 2. Use a custom builder function

**Signature: `.use(fn: builder)`**

A builder is just a function (even when it comes from a plugin).

Here's a custom, inline builder that prepends a comment to all CSS files:

```js
exhibit()
  .use(function ({ext, contents}) {
    if (ext === '.css') {
      contents = '/* Copyright 2015 AwesomeCorp */\n' + contents;
    }

    return contents;
  })
  .build('src', 'dist');
```

See [writing a builder](../writing-a-builder.md) for more details.


### 3. Use another Exhibit app

**Signature: `.use(Exhibit: app)`**

Sequences are infinitely composable: you can pass another Exhibit app to `.use()`.


```js
// a basic sequence to build your code to HTML/CSS/JS
var app = exhibit()
  .use('jade')
  .use('sass')
  .use('autoprefixer')
  .use('babel')
  .use('browserify');

// a production sequence that expands on the above with some extra steps
var prod = exhibit()
  .use('eslint', {fail: true})
  .use(app)
  .use('concat')
  .use('uglify')
  .use('clean-css');

if (doProdBuild) {
  prod.build('src', 'dist');
}
else {
  app.build('src', 'tmp');
}
```
