/**
 * Utility function for loading a plugin and invoking it to configure and return a builder function.
 *
 * These are functionally equivalent:
 * - `plugin('foo', 1, 2)`
 * - `require('exhibit-plugin-foo')(1, 2)`
 */

export default function plugin(name, ...args) {
  let loadedPlugin;
  try {
    loadedPlugin = require(`exhibit-plugin-${name}`);
  }
  catch (error) {
    // TODO format 'can't find module' errors nicely, with suggested solution

    throw error;
  }

  return loadedPlugin(...args);
}
