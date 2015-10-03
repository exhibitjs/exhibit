# Exhibit.js (alpha)

> #### Realtime build tool

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

*Requires Node 4*

```sh
$ npm install exhibit
```

Exhibit helps you set up a continuous flow of files from one directory to another – via a series of 'builders'.

A working example:

```js
exhibit('src')
  .use(babel())
  .use(sass())
  .use(autoprefixer())
  .use(rev())
  .build('dist', {watch: true});
```

- designed for the smoothest watch-and-rebuild experience
- rebuilds are **100% incremental**, therefore insanely fast
- friendly, middleware-style API
- clean, clear logging of what's being built
- straightforward plugin system
- no temp files
- great for building static sites and single-page webapps

The above example reads all files within './src', puts them through three builders in turn, then outputs the results to `./dist`. (Then it continues watching `./src` and rebuilding individual files incrementally, thanks to `{watch: true}`.)

Check out the [examples](./examples).


## The fastest rebuilds ever

Instead of parallelizing everything into [task spaghetti](https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js), Exhibit keeps things simple with a series approach:

---

![Exhibit flowchart](https://raw.githubusercontent.com/exhibitjs/exhibit/lazy-load-builders/docs/flowchart.png)

---

Every cache contains the whole app (as it stands at that point in the sequence). This, combined with a smart batching system that remembers dependencies across multiple builds, means Exhibit knows exactly what needs to be rebuilt after each change.

This means it can be faster where it really matters: **incrementally rebuilding** after small changes.

**An example:** let's say you've got your Exhibit chain running, and you edit <code>_foo.scss</code> (somewhere within your `src` directory). Exhibit *remembers* that the Sass plugin imported that file last time it was building <code>main.scss</code>, but not when it was building <code>other.scss</code>. So Exhibit responds to your edit by pushing only <code>main.scss</code> through that plugin.


## Builders

These are usually come from builder plugins, which are just NPM modules named `exhibit-builder-*`.

Or you can write your own builder inline – [see `.use()`` docs](#).

### Existing builder plugins

- Babel
- Browserify
- Sass
- Autoprefixer
- Uglify

More coming soon: Webpack, Jade, Less, Stylus. ([Open an issue](#) to request another.)

**ProTip:** pass a string and Exhibit will auto-require your builders, e.g. `.use('babel')`. [More info](./docs/api/use.md).


## Usage

Simply `require('exhibit')` and use it in any Node script.

The API is small:

- [`exhibit('src')`](#) returns an instance that will read from the './src' directory.

- [`.use(builder)`](#) adds a builder to the chain.

- [`.build('dist')`](#) starts building to the 'dist' directory (and returns a promise).

See the [full docs](./docs) for more details.


## Using with gulp

Exhibit is not related to gulp.

But they work nicely together, because `.build()` returns a promise, which gulp likes:

```js
gulp.task('build', function () {
  return exhibit('src')
    .use(babel())
    .use(sass())
    .build('dist');
});
```


## Licence

MIT


<!-- badge URLs -->
[npm-url]: https://npmjs.org/package/exhibit
[npm-image]: https://img.shields.io/npm/v/exhibit.svg?style=flat-square

[travis-url]: http://travis-ci.org/exhibitjs/exhibit
[travis-image]: https://img.shields.io/travis/exhibitjs/exhibit.svg?style=flat-square

[depstat-url]: https://david-dm.org/exhibitjs/exhibit
[depstat-image]: https://img.shields.io/david/exhibitjs/exhibit.svg?style=flat-square
