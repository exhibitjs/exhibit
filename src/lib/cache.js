// TODO: refactor lazy-builder code directly into this file, implementing this new api directly

import LazyBuilder from 'lazy-builder';

export default function cache(fn) {
  return new LazyBuilder(function (name, contents) {
    const include = this.importFile;

    return fn(contents, name, include);
  }).build;
}
