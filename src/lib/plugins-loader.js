/**
 * A function to load all local plugins registered in the CWD's package.json.
 */

import {join} from 'path';
import camelCase from 'camelcase';

export default function plugins() {
  const pkg = require(join(process.cwd(), 'package.json'));

  const moduleNames = [];
  if (pkg.devDependencies) moduleNames.push.apply(moduleNames, Object.keys(pkg.devDependencies));
  if (pkg.dependencies) moduleNames.push.apply(moduleNames, Object.keys(pkg.dependencies));

  const moduleLookup = {};
  const functionNames = [];
  for (const moduleName of moduleNames) {
    if (moduleName.substring(0, 8) === 'exhibit-') {
      const functionName = camelCase(moduleName.substring(8));
      functionNames.push(functionName);
      moduleLookup[functionName] = moduleName;
    }
  }

  const loadedPlugins = {};
  const lazyLoader = {};

  functionNames.forEach(functionName => {
    Object.defineProperty(lazyLoader, functionName, {
      get: () => {
        if (!loadedPlugins[functionName]) {
          loadedPlugins[functionName] = require(moduleLookup[functionName]);
        }
        return loadedPlugins[functionName];
      },
    });
  });

  return lazyLoader;
}
