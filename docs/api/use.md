[exhibit()](exhibit.md) &nbsp;|&nbsp; .use() &nbsp;|&nbsp; [.build()](build.md)

---

# .use()

Adds a new builder to the sequence.

There are three ways to call it.

### With a plugin name

> .use( string: **pluginName**, string: [ **...args** ] )

Automatically imports the appropriate builder plugin for you, and calls it (along with any extra arguments you provide) to retrieve a configured builder function:

```js
exhibit()
  .use('babel', {stage: 1})
  .build('src', 'dist');
```

<br>

> **Understand:** calling `.use('babel', {stage: 1})` is really just a shortcut for this:
> 
> ```js
>   .use( require('exhibit-builder-babel')({stage: 1}) )
> ```

---

### With a custom builder function

> .use( function: **builder** )

A builder is just a function (even when it comes from a plugin).

Here's a custom builder that prepends a comment to all CSS files:

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

Builder functions can access several API methods and data. See [writing a builder](../writing-a-builder.md) for more details.

---

### With another Exhibit instance

> .use( Exhibit: **exhibit** )

Sequences are infinitely composable.


```js
// basic sequence: steps to build your code to HTML/CSS/JS
var app = exhibit()
  .use('jade')
  .use('sass')
  .use('autoprefixer')
  .use('babel')
  .use('browserify');

// production sequence: wraps it with extra steps
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
  app.build('src', 'dist-dev');
}
```
