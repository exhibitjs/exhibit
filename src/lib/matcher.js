import micromatch from 'micromatch';
import _ from 'lodash';

const alwaysTrue = () => true;

/**
 * Given a pattern of any kind, returns a function that can be used repeatedly
 * to check file paths against that pattern.
 */

export default function matcher(pattern) {
  switch (pattern) {
    case '**':
    case '**/*':
    case true:
    case undefined:
    case null:
      return alwaysTrue;

    case false:
      throw new Error('exhibit matcher: pattern cannot be false');

    case '':
      throw new Error('exhibit matcher: pattern cannot be an empty string');

    default:
      if (_.isString(pattern) || _.isArray(pattern)) return micromatch.filter(pattern);
      if (_.isFunction(pattern)) return name => Boolean(pattern(name));
      if (_.isRegExp(pattern)) return name => pattern.test(name);

      throw new TypeError(`exhibit matcher: Unexpected pattern type: ${typeof pattern}`);
  }
}
