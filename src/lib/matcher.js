import micromatch from 'micromatch';
import { isFunction, isRegExp } from 'lodash';

const alwaysTrue = () => true;
const alwaysFalse = () => false;

/**
 * Given a pattern of any kind, returns a function that can be used repeatedly
 * to check file paths against that pattern.
 */
export default function matcher(pattern) {
  if (pattern === '**' || pattern === true) return alwaysTrue;

  if (isFunction(pattern)) return name => Boolean(pattern(name));

  if (isRegExp(pattern)) return name => pattern.test(name);

  if (!pattern) return alwaysFalse;

  return micromatch.filter(pattern);
}
