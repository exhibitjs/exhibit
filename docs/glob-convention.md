# Glob convention

Exhibit builders are all provided a standard `matches()` function to test each build job against a given pattern.

The result is that most builder plugins follow the same convention when resolving options such as `include` or `exclude`.

For example:

```js
  .use('jshint', {
    include: ['**/*.js', '!scripts/vendor/**/*.js']
  })
```

...causes the [jshint](https://github.com/exhibitjs/builder-jshint) builder to lint any `.js` files found anywhere in your app *except* within `scripts/vendor`.

> Under the hood, Exhibit uses Jon Schlinkert's speedy [micromatch](https://github.com/jonschlinkert/micromatch) module.

## The rules

You can use:

- **a single glob string**
  - e.g. `{include: '**/*.js'}` would match any JavaScript file in any subdirectory
  - note that an exact file path can be used as a 'glob' too – e.g. `{include: 'foo/bar.txt'}` matches only that file
  - see @isaacs’s [glob primer](https://github.com/isaacs/node-glob#glob-primer) for what the special characters mean.

- **an array of glob strings**
  - e.g. `{include: ['**/*.js', '!**/*.special.js']}` would match any JS file *except* those ending with `.special.js`
  - follows multimatch's system for interpreting [multiple patterns](https://github.com/sindresorhus/multimatch#how-multiple-patterns-work)

- **a custom function**
  - should return `true` or `false` for a given file path
  - e.g. `{include: function (file) {return file !== 'foo.js'}}` matches any file except `foo.js`

- **a regular expression**
  - e.g. `{include: /\/foo\.js$/}` matches any file called `foo.js` in any directory

- **`null`** (or anything falsey) is a legal value, but won't match anything

> NB. The filename being tested is always the **relative path** from the base directory.


#### A note on negative patterns

- Providing a negative glob as a **single glob string** simply means "match *everything* except this". So `'!**/*.js'` means "everything except JavaScript".

- Providing a negative glob **within an array of globs** means "remove anything that's already been matched if it matches this".
  - Therefore `['!**/*.js']` is pointless as it will never match anything. You need to first match *something* before using negation in an array, e.g. `['**/*', '!**/*.js']` matches everything except `.js` files.
  - It's easiest to think of an array as building up a set of matches step by step. Each new glob modifies the set of files selected so far – either adding or removing files, depending on whether it's a positive or negative glob.
