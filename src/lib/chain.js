import normalize from './normalize';
import { isFunction } from 'lodash';

/**
 * Like a generic promise waterfall, but specifically for passing a file map
 * through a series of builder functions.
 *
 * Also normalizes the file map on the way in and out of every builder.
 */

export default function chain(...args) {
  // validate/normalize args
  const fns = args.filter(fn => {
    if (fn === undefined || fn === null) return false;

    if (isFunction(fn)) return true;

    throw new TypeError('Every argument to chain() must be a function or null/undefined');
  });

  // return the chained builder
  return async function chainedBuilder(_files) {
    let files = _files;

    for (const fn of fns) {
      files = normalize(files);

      // call the next function
      files = await Promise.resolve(fn(files));
    }

    return normalize(files);
  };
}
