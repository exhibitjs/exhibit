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
  .use('babel', {skip: 'vendor/**'})
  .use('concat')
  .use(customFunc);

// start building from ./src to ./public
app.build('src', 'public', {watch: true});
```

But unlike Express, it's not for running on a production server. It's just for processing static files – it pushes everything from one directory to another via your chosen build steps (e.g.&nbsp;`src/main.scss`&nbsp;→&nbsp;`public/main.css`).

**So it's like gulp?** Not really – it has no CLI and it's not a task runner. It's just a nice little API for managing a series of changes to a bunch of files. It solves some fundamental problems that pla You can use Exhibit *with* gulp, or with another task runner ...or with good old `$ node`.


#### Real-time, incremental rebuilding

Exhibit's secret weapon is `watch: true`, for use while you're developing your app. It tells Exhibit to watch the source directory and rebuild individual files as needed.

Thanks to memory caching and work-avoidance, rebuilding usually happens **in the blink of an eye**.

![Exhibit flowchart]

> Every cache contains the entire app as it stands. Exhibit detects changes in each cache to decide which files must be built in the next step – nothing is ever rebuilt unnecessarily. This approach outperforms a typical gulp task setup where it matters most: frequent rebuilding after small changes.
>
> You don't need to worry about any of this, it just works.


#### Bonus features

There's a bundled development server, if you need it. And with one line you can wire it up with BrowserSync, for automatic browser refreshes after every change – check out the [options].

---

## Plugins

Builder plugins are simply npm modules named `exhibit-builder-*`.

> NB. `use('foo')` is a shortcut for `use(require('exhibit-builder-foo')())`

Here's a few you can use now):

- [babel](https://github.com/exhibit)
- [browserify](https://github.com/exhibitjs/builder-browserify)
- [sass](https://github.com/exhibitjs/builder-sass)
- [autoprefixer](https://github.com/exhibitjs/builder-autoprefixer)
- ~~[jade](https://github.com/exhibitjs/builder-jade)~~
- [concat](https://github.com/exhibitjs/builder-concat)
- ~~[minify-html](https://github.com/exhibitjs/builder-minify-html)~~
- ~~[clean-css](https://github.com/exhibitjs/builder-clean-css)~~
- [uglify](https://github.com/exhibitjs/builder-uglify)
- ~~[imagemin](https://github.com/exhibitjs/builder-imagemin)~~
- [include-assets](https://github.com/exhibitjs/builder-include-assets)
- ~~[rev](https://github.com/exhibitjs/builder-rev)~~
- ~~[sw-precache](https://github.com/exhibitjs/builder-sw-precache)~~
- ~~[rollup](https://github.com/exhibitjs/builder-rollup)~~

*Struck-out plugins are in development.*

Want something else? [Request a plugin][issues] (or even [publish one][publishing guidelines]).


> #### Handwritten builders
> 
> Plugins are just a convenience – you can also [write a builder inline][writing a builder]:
> 
> ```js
>   .use(function () {...})
> ```

---

## Quick start

#### Use a starter kit

###### [Exhibit web starter kit](https://github.com/exhibitjs/exhibit-wsk)

This is a fork of Google's excellent Web Starter Kit, adapted to use Exhibit.

Like the [original](https://github.com/google/web-starter-kit), it uses gulp as a convenient CLI for running tasks (`gulp serve` and `gulp build`). But the gulpfile's size has been dramatically reduced (check out [the diff](diff)!) and the watch-and-rebuild experience is faster.

###### ~~[Exhibit electron app starter kit](https://github.com/exhibitjs/exhibit-electron-starter-kit)~~

> *In development*

###### ~~[Yeoman webapp generator](https://github.com/exhibitjs/generator-exhibit-webapp)~~

> *In development*

<!-- 
 -->


#### Manual setup

Follow the 5 minute [tutorial].

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
