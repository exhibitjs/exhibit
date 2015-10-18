<div align="center">
  <h1>Exhibit.js (alpha)</h1>
  <p><a href="https://npmjs.org/package/exhibit"><img alt="NPM version" src="https://img.shields.io/npm/v/exhibit.svg?style=flat-square"></a> &nbsp;<a href="http://travis-ci.org/exhibitjs/exhibit"><img alt="Build Status" src="https://img.shields.io/travis/exhibitjs/exhibit.svg?style=flat-square"></a> &nbsp;<a href="https://david-dm.org/exhibitjs/exhibit"><img alt="Dependency Status" src="https://img.shields.io/david/exhibitjs/exhibit.svg?style=flat-square"></a></p>
</div>

---

Jump to:&nbsp; [Quick start](#quick-start) &nbsp;|&nbsp; [Plugins](#plugins)

---


## What is Exhibit?

Exhibit is an unopinionated little library for efficiently building **static projects** – single-page apps, browser extensions, Electron apps, etc.

Its API is inspired by [Express](http://expressjs.com/) and looks very familiar:

```js
var exhibit = require('exhibit');

// declare a sequence of build steps
var app = exhibit()
  .use('sass')
  .use('autoprefixer')
  .use('babel', {stage: 1, skip: 'scripts/vendor/**'})
  .use('concat')
  .use(customFunc);

// start building from ./src to ./public
app.build('src', 'public', {watch: true});
```

But unlike Express, it's not for running on a production server – it's for processing static files.

It pushes everything from one directory to another via your chosen build steps (e.g.&nbsp;`src/main.scss`&nbsp;→&nbsp;`public/main.css`).

**So it's like gulp?** Not really – it has no CLI, and it's not a task runner. It's just a fast little API for managing a series of changes to a bunch of files. You can use Exhibit [*with* gulp][using with gulp], or with another task runner ...or with good old `$ node`.

#### Real-time, incremental rebuilding

Exhibit's secret weapon is `watch: true`, for use while you're developing your app. It tells Exhibit to watch the source directory and **automatically rebuild** individual files as needed.

Thanks to memory caching and work-avoidance, rebuilding usually happens in the blink of an eye.

![Exhibit flowchart]

> Every cache contains the entire app as it stands. Each cache fires change events to determine which files must be built in the next step, and so on – nothing is ever rebuilt unnecessarily. This approach outperforms a typical gulp task setup where it matters most: frequent rebuilding after small changes.
>
> You don't need to worry about any of this, it just works.


#### Bonus features

There's a bundled development server, if you need it. And with one line you can wire it up with BrowserSync, for automatic browser refreshes after every change – check out the [options].


---


## Plugins

> Builder plugins are npm modules named `exhibit-builder-*`.
>
> NB. `use('sass')` is a shortcut for `use(require('exhibit-builder-sass')())`

- [autoprefixer](https://github.com/exhibitjs/builder-autoprefixer)
- [babel](https://github.com/exhibitjs/builder-babel)
- [browserify](https://github.com/exhibitjs/builder-browserify)
- [clean-css](https://github.com/exhibitjs/builder-clean-css)
- [concat](https://github.com/exhibitjs/builder-concat)
- [imagemin](https://github.com/exhibitjs/builder-imagemin)
- [minify-html](https://github.com/exhibitjs/builder-minify-html)
- [sass](https://github.com/exhibitjs/builder-sass)
- [sw-precache](https://github.com/exhibitjs/builder-sw-precache)
- [uglify](https://github.com/exhibitjs/builder-uglify)

More on the way soon: jade, rev, rollup, eslint.

Want something else? [Request a plugin][issues] (or even [publish one][publishing guidelines]).


#### Handwritten builders

Plugins are just a convenience – you can also [write a builder inline][writing a builder]:

```js
  .use(function () {...})
```


---


## Quick start

#### Use a starter kit

###### [Exhibit web starter kit](https://github.com/exhibitjs/exhibit-wsk)

This is a fork of Google's excellent Web Starter Kit, adapted to use Exhibit.

Like the [original](https://github.com/google/web-starter-kit), it still uses gulp as a CLI for running tasks (`gulp serve` and `gulp build`). But the gulpfile is half the size and the build is much faster.

###### ~~Exhibit electron app starter kit~~

> *In development*

###### ~~Yeoman webapp generator~~

> *In development*

<!-- 
 -->

<!-- 
#### Manual setup

Follow the 5 minute [tutorial].
 -->
---

## Contributing

Contributions are **very** welcome. This project is at an early stage so feel free to [open an issue](https://github.com/exhibitjs/exhibit/issues) if you have any questions/feedback/ideas.


## Licence

MIT


[exhibit flowchart]: docs/flowchart.png
[options]: docs/api/build.md#options
[issues]: https://github.com/exhibitjs/exhibit/issues
[writing a builder]: docs/writing-a-builder.md
[publishing guidelines]: docs/publishing-guidelines.md
[use]: docs/api/use.md
[tutorial]: docs/tutorial.md
[using with gulp]: docs/using-exhibit-with-gulp.md
