/**
 * A function to load all local plugins registered in the CWD's package.json.
 */

import camelCase from 'camelcase';
import {join} from 'path';

export default function autoLoadPlugins() {
  const pkg = require(join(process.cwd(), 'package.json')); // eslint-disable-line global-require

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
          loadedPlugins[functionName] = require(moduleLookup[functionName]); // eslint-disable-line global-require
        }
        return loadedPlugins[functionName];
      },
    });
  });

  return lazyLoader;
}
