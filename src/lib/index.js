/**
 * The public API for Exhibit. For building up a configuration and then calling `.build()` - at which point it initialises a Controller instance to manage the [ongoing] build process.
 */

import path from 'path';
import isString from 'lodash/lang/isString';
import isBoolean from 'lodash/lang/isBoolean';
import isFunction from 'lodash/lang/isFunction';
import isArray from 'lodash/lang/isArray';
import assign from 'lodash/object/assign';
import {map} from 'in-place';
import Controller from './controller';
import genericImporter from './bundled-plugins/generic-importer';
import {colours} from 'exhibit-core';

const {red, green} = colours;

const ORIGIN = Symbol();
const IMPORTERS = Symbol();
const CONTROLLER = Symbol();
const USE_CALLS = Symbol();

const cwd = process.cwd();
const validPluginName = /^[a-z]([a-z]|(-(?!-)))+[a-z]$/; // http://refiddle.com/hfy


const buildDefaults = {
  watch: false,
  serve: false,
  browserSync: false,
  open: false,
  bsSnippet: true, // can be only true or false, defaults to true (but has no effect if no browserSync)
  verbose: false,
  autoImporters: true,
};

const watchDefaults = {
  watch: true,
  serve: true,
  browserSync: true,
  open: true,
};


/**
 * This class models the public API. The real core of Exhibit is the Controller class. The Exhibit class is a layer on top of Controller.
 */

class Exhibit {
  constructor({origin, importers = []}) {
    this[ORIGIN] = origin;
    this[IMPORTERS] = importers;
    // this[BUILDERS] = [];
    this[USE_CALLS] = [];
  }


  /**
   * Adds a step to the build sequence.
   */
  use(...args) {
    this[USE_CALLS].push(args);
    return this;
  }


  /**
   * Creates a controller and starts it, returning a promise that resolves when the initial batch has been run and all changes sync'd to the output directory.
   */
  async build(destDir, useWatchDefaults, options) {
    // validation
    if (!isString(destDir)) {
      throw new Error('Expected first argument to .build() to be a string.');
    }

    if (this[CONTROLLER]) throw new Error('This Exhibit is already building.');

    // handle variable number of args
    if (useWatchDefaults && !isBoolean(useWatchDefaults)) {
      options = useWatchDefaults;
      useWatchDefaults = false;
    }

    // use default options (possibly with the 'watch' overrides)
    options = assign({}, buildDefaults, useWatchDefaults ? watchDefaults : null, options);
    if (!options.serve) options.open = false;


    // walk up the chain to find the first exhibit instance, and collect all their 'use' calls too
    let firstExhibit = this;
    while (firstExhibit[ORIGIN] instanceof Exhibit) {
      firstExhibit = firstExhibit[ORIGIN];

      for (let i = firstExhibit[USE_CALLS].length - 1; i >= 0; i--) {
        this[USE_CALLS].unshift(firstExhibit[USE_CALLS][i]);
      }
    }
    console.assert(isString(firstExhibit[ORIGIN]), 'origin of first exhibit should be a string');


    // resolve the build sequence to an array of builder functions
    const failedImports = [];
    const builders = [];

    this[USE_CALLS].forEach((args, i) => {
      const firstArg = args[0];

      if (isString(firstArg)) {
        if (!validPluginName.test(firstArg)) throw new Error(`Invalid name for lazy-loaded builder: ${firstArg}`);

        const moduleName = `exhibit-builder-${firstArg}`;
        let module;
        try {
          module = require(moduleName); // eslint-disable-line global-require
        }
        catch (error) {
          console.log('error', error);
          failedImports.push(moduleName);
          return;
        }

        let fns = module.apply(null, args.slice(1));

        if (!isArray(fns)) fns = [fns];

        fns.forEach(fn => {
          if (!isFunction(fn)) {
            throw new Error(`The module ${moduleName} returned an invalid builder.`);
          }

          builders.push(fn);
        });
      }
      else if (isFunction(firstArg)) {
        builders.push(firstArg);
      }
      else throw new TypeError(`A call to .use() (#${i}) had invalid arguments.`);
    });

    // exit with a useful message if any lazy imports failed
    if (failedImports.length) {
      let command = `  npm install --save-dev`;
      if (failedImports.length === 1) command += (' ' + failedImports[0]);
      else {
        for (const moduleName of failedImports) {
          command += ' \\\n    ' + moduleName;
        }
      }
      command += '\n';

      console.log(red(`\nFailed to import ${failedImports.length} builder${failedImports.length > 1 ? 's' : ''}.`));
      console.log(`\nTry installing ${failedImports.length > 1 ? 'them' : 'it'} with this command:\n`);
      console.log(green(command));
      process.exit(1);
    }

    // create and run a controller
    this[CONTROLLER] = new Controller({
      originDir: firstExhibit[ORIGIN],
      destDir,
      importers: this[IMPORTERS],
      buildOptions: options,
      builders,
      cwd,
    });

    return this[CONTROLLER].execute();
  }


  /**
   * Closes anything listening to the system (e.g. servers, watchers), allowing the process to end.
   */
  stop() {
    if (this[CONTROLLER]) return this[CONTROLLER].stop();
    throw new Error('Cannot call .stop() on Exhibit that has not started.');
  }
}


/**
 * We export a single function that returns Exhibit instances.
 */
export default function exhibit(origin, ...importers) {
  if (isString(origin)) {
    // resolve the importers to real functions
    map(importers, importer => {
      if (isString(importer)) return genericImporter(path.resolve(cwd, importer));
      // if (isFunction(importer)) return path.resolve(cwd, importer);
      if (isFunction(importer)) return importer;
      throw new TypeError(`Expected importer to be string or function; got ${typeof importer}`);
    });

    return new Exhibit({origin, importers});
  }
  else if (origin instanceof Exhibit) {
    if (importers.length) {
      throw new TypeError('Importers can only be set on an Exhibit instance that reads directly from disk.');
    }

    // Make a new Exhibit with this one as its source
    return new Exhibit({origin});
  }

  throw new TypeError('Expected first argument to be a string or another Exhibit instance.');
}
