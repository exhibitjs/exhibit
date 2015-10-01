/**
 * The public API for Exhibit. For building up a configuration and then calling `.build()` - at which point it initialises a Controller instance to manage the [ongoing] build process.
 */

import path from 'path';
import isString from 'lodash/lang/isString';
import isBoolean from 'lodash/lang/isBoolean';
import isFunction from 'lodash/lang/isFunction';
import assign from 'lodash/object/assign';
import {map} from 'in-place';
import Controller from './controller';
import autoLoadPlugins from './auto-load-plugins';
import genericImporter from './bundled-plugins/generic-importer';

const ORIGIN = Symbol();
const IMPORTERS = Symbol();
const CONTROLLER = Symbol();
const BUILDERS = Symbol();

const cwd = process.cwd();


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
    this[BUILDERS] = [];
  }


  /**
   * Adds a step to the build sequence.
   */
  use(builder) {
    if (!isFunction(builder)) throw new TypeError('Expected .use() argument to be a function.');
    this[BUILDERS].push(builder);
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

    // walk up the chain to find the first exhibit instance, and collect all builders found along the way
    let firstExhibit = this;
    const builders = this[BUILDERS].slice();
    while (firstExhibit[ORIGIN] instanceof Exhibit) {
      firstExhibit = firstExhibit[ORIGIN];

      for (let i = firstExhibit[BUILDERS].length - 1; i >= 0; i--) {
        builders.unshift(firstExhibit[BUILDERS][i]);
      }
    }

    console.assert(isString(firstExhibit[ORIGIN]), 'origin of first exhibit should be a string');

    // create the controller
    this[CONTROLLER] = new Controller({
      originDir: firstExhibit[ORIGIN],
      destDir,
      importers: this[IMPORTERS],
      buildOptions: options,
      builders,
      cwd,
    });

    // run it
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


exhibit.plugins = autoLoadPlugins;
