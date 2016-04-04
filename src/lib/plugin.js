import _ from 'lodash';
import path from 'path';
import resolveFrom from 'resolve-from';
import stackTrace from 'stack-trace';
import { cyan, red } from 'chalk';

/**
 * Utility function for loading a plugin module and invoking it, to configure
 * and return a builder function.
 *
 * These are roughly equivalent:
 * - `plugin('foo', arg1, arg2)`
 * - `require('exhibit-plugin-foo')(arg1, arg2)`
 */

export default function plugin(name, ...args) {
  if (!_.isString(name)) throw new TypeError('exhibit plugin(): name must be a string');
  if (!/[a-z-]+/.test(name)) throw new Error('exhibit plugin(): invalid characters in name');

  const callingFile = stackTrace.get()[1].getFileName();
  const pluginPath = resolveFrom(path.dirname(callingFile), `exhibit-plugin-${name}`);

  if (!pluginPath) {
    console.error(
      red(`\n\nCould not find plugin: ${name}`) +
      '\n\nIf this plugin is published on npm, you can install it like this:\n\n' +
      cyan(`  npm install -D exhibit-plugin-${name}\n\n`)
    );

    throw new Error(`Exhibit plugin not found: exhibit-plugin-${name}`);
  }

  const loadedPlugin = require(pluginPath);

  return (loadedPlugin.default || loadedPlugin)(...args);
}
