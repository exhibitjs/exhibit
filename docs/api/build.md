# .build()

**Starts the build.**

This is the workhorse method that builds your files, from one directory to another (and optionally keeps rebuilding them indefinitely).

---

**Signature: `.build(string: origin, string: destination, [object: options])`**

Example:

```js
exhibit()
  .use('babel')
  .use('sass')
  .build('app', 'dist', {
    watch: true,
    serve: true,
    browserSync: true
  }).then(function (files) {
    // ...
  });
```

The `origin` and `destination` arguments are directories, and will be resolved from the current working directory using Node's path.resolve().

When you call `.build()`, Exhibit loads all the contents of both the origin and destination directories recursively into memory. It then puts all the origin files through the sequence of builders (which was set up with a series `.use()` calls) until everything has been written into the final cache, possibly changing what was loaded from disk. Any changes are then persisted to disk. If you use `watch`, it will keep running and perform incremental rebuilds over time.


## Return value

The `.build()` method always returns a promise, which resolves when the first batch of files (or the only batch, if you're not using `watch`) has been written to the destination.

The resolution value is an array of objects detailing the changes that occurred in the destination directory due to the first batch.

Note that using any combination of `watch`, `serve` and `browserSync` will keep the process running even after the initial build promise has resolved – the resolution only means the initial batch of files has been written out to disk, i.e. that the destination directory is now 'in sync' with the origin.


## Options

The default options will simply build your app and then stop.


##### `watch`

**Default: `false`**

When enabled, Exhibit will watch everything in the origin directory for changes.

Note that the promise returned from `.build()` will still resolve after the *first* batch of files has been written. ~~If you want to be notified of further changes, you'll need to use events~~ *not yet implemented*.


##### `serve`

**Default: `false`**

Enables a very simple static file server (using [Connect](http://www.senchalabs.org/connect/static.html)) to serve up your destination directory.

An available port will be found automatically.


##### `browserSync`

**Default: `false`**

Enabling this magically wires up your site with BrowserSync, so your browser will refresh whenever relevant files change in your destination directory.

What this actually does:

- starts a BrowserSync server on an available port.
- adds a secret, final builder to your chain, which injects a snippet of JavaScript into all HTML files.

Obviously, it only makes sense to use this in development.


##### `open`

**Default: `false`**

Uses [opn](https://github.com/sindresorhus/opn) to open localhost in your default browser on the appropriate port. (Only works in conjunction with `serve`.)


##### `verbose`

**Default: `false`**

Prints out a **lot** of extra debugging information.


---

## Alternative defaults

By passing a boolean `true` as the third argument, you can switch to an alternative set of defaults.

It's a convenient shortcut for enabling these four options at once: `watch`, `serve`, `browserSync` and `open`.

**Signature: `.build(string: origin, string: destination, boolean: useAltDefaults, [object: options])`**


```js
.build('dist', true);
```

You may still pass an options object (which takes precedence), for example:

```js
.build('dist', true, {open: false});
```
