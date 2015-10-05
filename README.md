<div align="center">
  <h1>Exhibit.js (alpha)</h1>
  <img src="./docs/illustration.png">
  <br><br>
  <p><b>Real-time incremental build.</b></p>
  <br><br>
  <p><a href="https://npmjs.org/package/exhibit"><img alt="NPM version" src="https://img.shields.io/npm/v/exhibit.svg?style=flat-square"></a> &nbsp;<a href="http://travis-ci.org/exhibitjs/exhibit"><img alt="Build Status" src="https://img.shields.io/travis/exhibitjs/exhibit.svg?style=flat-square"></a> &nbsp;<a href="https://david-dm.org/exhibitjs/exhibit"><img alt="Dependency Status" src="https://img.shields.io/david/exhibitjs/exhibit.svg?style=flat-square"></a></p>
  <p><i>(Requires Node 4)</i></p>
</div>


---

Jump to:&nbsp; [Getting started](#getting-started) &nbsp;|&nbsp; [Using with gulp](#using-with-gulp) &nbsp;|&nbsp; [Builders](#builders)

---


## What is Exhibit?

Exhibit is a library that helps you set up an **incremental flow of files** from one directory to another, via an arbitrary series of build steps.

It has a middleware-style API:

```js
exhibit('./src')
  .use(babel())
  .use(sass())
  .use(autoprefixer())
  .use(rev())
  .build('./dist', {watch: true});
```

The above snippet reads all files in `./src`, pushes the whole app through four ‘builders’, and outputs the result to `./dist`.

Then, because of `{watch: true}`, it watches `./src` for incremental changes, only doing the minimum work possible for each rebuild.


## Features

- designed for the smoothest watch-and-rebuild experience
- rebuilds are 100% incremental, therefore insanely fast
- everything is a plugin
- clean, clear logging of what's being built
- no temp files

It's ideal for building static sites, single-page apps, browser extensions, and other front-end projects. And you can wire it up to BrowserSync with one line.


## The fastest rebuilds ever

A heavily parallelized front end build system can start to look like [task spaghetti](https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js). The linked example works well, but it's hard to follow, and it's still inefficient when it comes to rebuilds.

Exhibit keeps things simple with a series approach. And a *lot* of in-memory caching.

![Exhibit flowchart](./docs/flowchart.png)

Every cache contains the entire application 'as it stands'. This, combined with a smart batching system that remembers dependencies per-step across multiple builds, means Exhibit knows exactly what needs to be rebuilt after each change.

That makes it faster where it really matters: **rebuilding after small changes**.

For the first time, it's possible to make a soup-to-nuts chain of build steps comprising preprocessors, bundlers, script/stylesheet concatenation, minification, image optimisation, and revving – and make it respond automatically to incremental changes with minimal effort at each step.

**An example:** let's say you've got your Exhibit chain running with `{watch: true}`, and you edit `_foo.scss` (somewhere within your `src` directory). Exhibit reacts by rebuilding this file. But when it comes to the Sass builder, Exhibit *remembers* that this builder imported that file last time it was building `main.scss` (but not when it was building `other.scss`). So it takes `main.scss` (from the in-memory cache before Sass) and tells Sass to rebuild it again.


## Getting started

Check out the examples [in this repo](./examples).

<!-- - [Web Starter Kit](https://github.com/exhibitjs/web-starter-kit) – a fork of Google's excellent front end boilerplate project, modified to use Exhibit. -->

<!-- - Yeoman generator: [exhibit-webapp](https://github.com/exhibitjs/generator-exhibit-webapp) – a fork of Yeoman's gulp-webapp project, modified to use Exhibit. -->

(Yeoman generator and Web Starter Kit fork coming soon.)


## Installation

```sh
$ npm install exhibit
```

Requires [Node 4](https://nodejs.org/en/).


## Documentation

Simply `require('exhibit')` and use it in any Node script.

The core API is tiny:

- [`exhibit('src')`](./docs/api/exhibit.md) returns an Exhibit chain that will read from the './src' directory.

- [`.use(builder)`](./docs/api/use.md) adds a builder to the chain.

- [`.build('dist')`](./docs/api/build.md) initiates building to the `./dist`' directory and returns a promise.

See the [full docs](./docs) for more details.


## Builders

### Loading builders from plugins

Builder plugins are simply NPM modules named `exhibit-builder-*` and include:

- Babel
- Browserify
- Sass
- Autoprefixer
- Uglify

More coming soon: Webpack, Jade, Less, Stylus. ([Open an issue](https://github.com/exhibitjs/exhibit/issues) to request another.)

**ProTip:** you can auto-require builders by passing a string, e.g. `.use('babel')`. [More info](./docs/api/use.md).


### Write builders inline

A builder is just a function: `.use(function () {...})`. [See `.use()` docs](./docs/api/use.md) for more details.


## Using with gulp

Exhibit is not related to gulp.

But they work great together because `.build()` returns a promise, and gulp likes promises:

```js
gulp.task('build', function () {
  return exhibit('src')
    .use(babel())
    .use(sass())
    .build('dist');
});
```


## Contributing

Contributions are **very** welcome. This project is at an early stage so feel free to [open an issue](https://github.com/exhibitjs/exhibit/issues) if you have any questions/feedback/ideas.

## Licence

MIT
