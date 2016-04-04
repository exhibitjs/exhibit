// TODO: refactor lazy-builder code directly into this file, implementing this new api directly

import LazyBuilder from 'lazy-builder';

export default function cache(fn) {
  return new LazyBuilder(function (name, content) {
    const include = this.importFile;

    return fn(content, name, include);
  }).build;
}
