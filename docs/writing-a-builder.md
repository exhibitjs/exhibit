# Writing a builder

> This document explains how to write a builder function. See also: [Plugin publishing guidelines](publishing-guidelines.md) if you want to release your builder for other people to use.

A builder is just a function. It's what's passed to `.use()`.

It deals with **one file at a time** (although it may import other files as part of this process) and returns whatever it wants to output to the next build step (or to the destination directory, if it's the last builder).

#### How hard is it?

Writing a builder is very simple for a 1→1 compilation step such as CoffeeScript or Autoprefixer (one input file → one output file).

It gets more complicated for *n*→1 or *n*→*n* compilations – i.e. anything that needs to import/include/require supporting files, such as Sass, Jade, Browserify, etc. These kind of tools must be configured to use Exhibit's import [methods](#methods) instead of disk I/O. Wiring them up properly can take a bit of effort, but it's what makes Exhibit’s language-agnostic incremental rebuilding possible.


## Simple example

Adding a copyright banner to the top of all CSS files:

```js
  .use(function (job) {
    // prepend a banner if it's a CSS file
    if (job.ext === '.css') {
      return '/* Copyright 2015 AwesomeCorp */\n' + job.contents;
    }

    // other filetypes: just pass them through untouched
    return job.contents;
  })
```

> The `job` object is expained [below](#the-job).


## What should you return?

Your return value is an instruction to write something to the cache following your builder. (Changes in this cache will then be passed to the next builder, or written to the output directory if there are no more builders.)

The **type** of your return value changes its meaning:

- string/buffer: assigns the given contents to the same path as came in.

- object: allows you to assign contents to custom (and multiple) filenames, using filenames for keys – see example below

- null: writes out nothing for this job. (Effectively blocks the file from getting through.)

- a promise/thenable that resolves with any of the above.

#### Example: outputting to custom paths

Here's a builder for an imaginary preprocessing language called FooScript, which compiles from `.foo` to `.js` and adds an external sourcemap:

```js
  .use(function (job) {
    if (job.ext === '.foo') {
      var compiled = foo(job.contents.toString());

      var output = {};
      var jsPath = job.path.replace(/foo$/, 'js');
      output[jsPath] = compiled.css;
      output[jsPath + '.map'] = compiled.map;
      return output;
    }
    
    // pass other filetypes straight through unmodified
    return job.contents;
  })
```

The filename keys in a results object may be absolute paths (as long as they're subdirectories of the `base`) or they may be relative paths (in which case they'll be resolved from the `base`).

#### Always return something

In most cases, if your builder isn't interested in a particular file, it should just return the contents buffer.

If you intend to block a file getting through, return `null` explicitly. Returning nothing (`undefined`) is assumed to be an accident and therefore triggers an error.

## The job

The job object is an instruction for building **one** file. It comes with several properties.

#### Data
- `contents` (buffer) – the contents of the file.
- `file` (string) – the absolute path to the file.
- `ext` (string) – just the extension, e.g. `.css`
  + NB. this should be considered a 'virtual' path – it's possible the file was actually created by another builder earlier in the chain.
- `base` (string) – the absolute path of the root of the application (i.e. the origin directory that the Exhibit app is reading files from).
- `fileRelative` (string) – the file's path relative to the `base`.

#### Methods
- `matches(matcher)` – returns true/false depending on whether the job's relative path matches the given 'matcher'.
    - A matcher can be a glob/filename or array thereof, and is passed to micromatch.filter() to get an actual filter function, which will be used to test the path. For example, `if (matches('**/*.css')) {...}` is one way to target CSS files.

- `emit(message, [payload])` – the Job class is an event emitter, so you can use this method to emit non-fatal errors (in situations where it makes more sense to emit than throw/reject).

- `importFile(file, [types])` – the main workhorse function for importing a supporting file. For example, if your builder was building SCSS files and encountered `@import 'foo';`, you might want to call this to load `_foo.scss`.
    - It first tries to find the file in cache preceding your builder, then tries external importers if necessary.
    - Calling this function also 'registers' with Exhibit that the path of the current job *depends* on the file you're importing. Exhibit will remember this for future rebuilds: if a change comes through for the *imported* file in future, Exhibit will add the original importing file to the batch and rebuild that too.
    - Returns a promise that resolves with an object with `{file, contents}`, where `file` is the fully resolved path telling you wherever the file was found (which might not be exactly what you requested), and `contents` is a buffer. The promise will reject if the file couldn't be found.
    - The second argument is an optional array of filetypes such as `['.js', '.jsx']`. This is provided only as a hint to some multi-type external importers like Bower, to set a preference for which filetype(s) you're interested in – it won't be considered if the exact path you requested is found internally in the pipeline.

- `importFirst(files, [types])` – like `import`, but takes an array of possible file paths, checks them one after the other and resolves with the first file found. Useful if you want to try a variety of paths that might satisfy a particular import statement in the code you're building.

- `importInternal`, `importExternal`, `importFirstExternal`, `importFirstInternal` – variants of the above `import*` methods.
    - While the methods `importFile` and `importFirst` check first internally and then externally, these methods will only do one or the other.
    - Note that the 'internal' ones return a file (or throw) synchronously, whereas all other import methods return a promise.

#### Utility belt

The following are available at `job.util`, for convenience:

- `lodash` aka `_`
- `bluebird` aka `Promise`
- `sander`
- `subdir`
- `micromatch`
- `SourceError` (you are encouraged to use this to report errors detailing the location of any error)
- `convertSourceMap`
- `combineSourceMap`

For example, in a builder function, `job.util.micromatch` is [micromatch](https://github.com/jonschlinkert/micromatch).


## Generators

You can also write a builder as a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/GeneratorFunction). This will be automatically wrapped as a [Bluebird coroutine](https://github.com/petkaantonov/bluebird/blob/master/API.md#generators) – so you can write it like an [async function](https://jakearchibald.com/2014/es7-async-functions/) (using `yield` instead of `await`).


## ES-next

The API's design is optimised for ES2015+ syntax, such as [destructuring](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) and [computed properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names).

```js
  .use(function *({ext, file, contents}) {
    if (ext === '.bar') {
      const {code, sourceMap} = yield compileBar(contents.toString());

      return {
        [file]: code,
        [file + '.map']: sourceMap
      };
    }

    return contents;
  })
```
