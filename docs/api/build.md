# `.build()`

**Starts the build.**

---

**Signature: `.build(string: destination, object: options)`**

```js
exhibit('src')
  .use('babel')
  .use('sass')
  .build('dist', {
    watch: true,
    serve: true,
    browserSync: true
  }).then(function (files) {
    // ...
  });
```

## Return value

The `.build()` method always returns a promise, which resolves when the first batch of changes (or the only batch, if you're not using `watch`) has been persisted to the destination.

The resolution value is an array of objects detailing the changes that occurred in the destination directory.


## Options

All options are optional.


### `watch`

**Default: `false`**

When enabled, Exhibit will watch everything in the source directory for changes.

Note that the promise returned from `.build()` will still resolve after the *first* batch of files has been written. ~~If you want to be notified of further changes, you'll need to use events~~ *not yet implemented*.


### `serve`

**Default: `false`**

Enables a very simple static file server (using [Connect](http://www.senchalabs.org/connect/static.html)) to serve up your destination directory.

An available port will be found automatically.


### `browserSync`

**Default: `false`**

Enabling this magically wires up your site with BrowserSync, so your browser will refresh whenever relevant files change in your destination directory.

What this actually does:

- starts a BrowserSync server on an available port.
- adds a secret, final builder to your chain, which injects a snippet of JavaScript into all HTML files.

Obviously, it only makes sense to use this in development.


### `open`

**Default: `false`**

Uses [opn](https://github.com/sindresorhus/opn) to open localhost in your default browser.

Only works in conjunction with `serve`.


### `verbose`

**Default: `false`**

Prints out a **lot** of extra debugging information.


---

## Alternative defaults

By passing a boolean `true` as the second argument, you can switch to an alternative set of defaults. It's a convenient shortcut for some situations.

The difference is that `watch`, `serve`, `browserSync` and `true` are all enabled – a good set of defaults for developing a static site or single-page app.

**Signature: `.build(string: destination, boolean: useOtherDefaults, object: options)`**


```js
.build('dist', true);
```

You may still pass an options object (which takes precedence), for example:

```js
.build('dist', true, {open: false});
```
