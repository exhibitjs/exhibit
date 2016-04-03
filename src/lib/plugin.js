/**
 * Utility function for loading a plugin and invoking it to configure and return a builder function.
 *
 * These are functionally equivalent:
 * - `plugin('foo', 1, 2)`
 * - `require('exhibit-plugin-foo')(1, 2)`
 */

import stackTrace from 'stack-trace';
import resolveFrom from 'resolve-from';
import path from 'path';
import { cyan, red } from 'chalk';

export default function plugin(name, ...args) {
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
