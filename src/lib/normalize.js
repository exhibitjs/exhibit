/**
 * Synchronously validates and normalizes a `files` object.
 *
 * Expects an Immutable Map or a plain object, and returns an Immutable Map
 * (guaranteeing that the keys are all normalized file paths and the values
 * are all buffers).
 *
 * If any key is not a string, or any value is not a buffer/string, this
 * function will throw.
 */

import path from 'path';
import Immutable from 'immutable';
import { isPlainObject } from 'lodash';

export default function normalize(_files) {
  let files = _files;

  if (Immutable.Map.isMap(files)) {
    // return fast if it's already been branded as normalized
    if (files.__exhibitNormalized === true) return files;

    // make `files` into a mutable plain object
    files = files.toObject();
  }
  else if (!isPlainObject(files)) {
    throw new TypeError('Expected files to be an Immutable Map or a plain object');
  }

  // validate/normalize all keys and values
  const keys = Object.keys(files);
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];

    // normalize the key as a path (handle .. etc)
    const normalizedKey = path.normalize(key);
    if (key !== normalizedKey) {
      files[normalizedKey] = files[key];
      delete files[key];
    }

    // ensure the value is a buffer
    const value = files[normalizedKey];
    if (!Buffer.isBuffer(value)) {
      if (typeof value === 'string') files[normalizedKey] = new Buffer(value);
      else throw new TypeError('Expected all values to be buffers or strings');
    }
  }

  // return it as an immutable map, branded as normalized
  const result = Immutable.Map(files);
  Object.defineProperty(result, '__exhibitNormalized', { value: true });
  return result;
}
