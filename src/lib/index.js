/**
 * The public API for Exhibit. For building up a configuration and then calling `.build()` - at which point it initialises a Controller instance to manage the ongoing build process.
 */

import path from 'path';
import isString from 'lodash/lang/isString';
import isBoolean from 'lodash/lang/isBoolean';
import isFunction from 'lodash/lang/isFunction';
import assign from 'lodash/object/assign';
import {map, concat} from 'in-place';
import Controller from './controller';
import pluginsLoader from './plugins-loader';

const ORIGIN = Symbol();
const LOAD_PATHS = Symbol();
const CONTROLLER = Symbol();
const PLUGINS = Symbol();

const cwd = process.cwd();


const buildDefaults = {
  watch: false,
  serve: false,
  browserSync: false,
  open: false,
  bsSnippet: true, // can be only true or false, defaults to true (but has no effect if no browserSync)
  verbose: false,
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
  constructor({origin, loadPaths}) {
    this[ORIGIN] = origin;
    this[LOAD_PATHS] = loadPaths;
    this[PLUGINS] = [];
  }


  /**
   * Adds a step to the build sequence.
   */
  use(plugin) {
    if (!isFunction(plugin)) throw new TypeError('Expected .use() argument to be a function.');
    this[PLUGINS].push(plugin);
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

    // walk up the chain to find the first exhibit instance, and concat all plugins found along the way
    let firstExhibit = this;
    const plugins = this[PLUGINS].slice();
    while (firstExhibit[ORIGIN] instanceof Exhibit) {
      firstExhibit = firstExhibit[ORIGIN];
      concat(plugins, firstExhibit[PLUGINS]);
    }

    console.assert(isString(firstExhibit[ORIGIN]), 'origin of first exhibit should be a string');

    // create the controller
    this[CONTROLLER] = new Controller({
      originDir: firstExhibit[ORIGIN],
      destDir: destDir,
      loadPaths: this[LOAD_PATHS],
      plugins,
      cwd,
      options,
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
export default function exhibit(origin, ...loadPaths) {
  if (isString(origin)) {
    // resolve the load paths
    map(loadPaths, loadPath => path.resolve(cwd, loadPath));

    return new Exhibit({origin, loadPaths});
  }
  else if (origin instanceof Exhibit) {
    if (loadPaths.length) {
      throw new TypeError('Load paths can only be set on an Exhibit instance that reads directly from disk.');
    }

    // Make a new Exhibit with this one as its source
    return new Exhibit({origin});
  }

  throw new TypeError('Expected first argument to be a string or another Exhibit instance.');
}


exhibit.plugins = pluginsLoader;
