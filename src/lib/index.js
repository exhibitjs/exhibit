/**
 * The public API for Exhibit. For building up a configuration and then calling `.build()` - at which point it initialises a Controller instance to manage the [ongoing] build process.
 */

import isFunction from 'lodash/lang/isFunction';
import isBoolean from 'lodash/lang/isBoolean';
import isString from 'lodash/lang/isString';
import isNumber from 'lodash/lang/isNumber';
import isArray from 'lodash/lang/isArray';
import autobind from 'autobind-decorator';
import Controller from './controller';
import {colours} from 'exhibit-core';
import {EventEmitter} from 'events';

const CONTROLLER = Symbol();
const USE_CALLS = Symbol();

const {red, green} = colours;
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
  loadPaths: null,
};

const watchDefaults = {
  watch: true,
  serve: true,
  browserSync: true,
  open: true,
};

/**
 * An Exhibit instance is essentially a friendly wrapper around a Controller instance.
 * It provides the public API.
 */
@autobind
class Exhibit extends EventEmitter {
  constructor() {
    super();
    this[USE_CALLS] = [];
  }

  /**
   * Adds a step to the build sequence.
   */
  use(...args) {
    // make an  object detailing this call, including a stack-primed type error
    // (in case we need to throw it asynchronously later)
    const callDetails = {
      args,
      typeError: new TypeError('Bad argument(s) to .use()'),
    };

    // first add it to a reference array
    this[USE_CALLS].push(callDetails);

    // then add it properly as a numeric index on this array-like instance
    Object.defineProperty(this, this[USE_CALLS].length - 1, {value: callDetails});

    return this;
  }

  /**
   * Creates a controller and executes it, returning a promise that resolves when the initial batch has been run and all changes sync'd to the output directory.
   */
  async build(originDir, destDir, useWatchDefaults, options) {
    if (!isString(originDir)) {
      throw new TypeError('Expected first argument to .build() to be a string.');
    }
    if (!isString(destDir)) {
      throw new TypeError('Expected second argument to .build() to be a string.');
    }

    if (this[CONTROLLER]) throw new Error('This Exhibit is already building.');

    // handle variable number of args
    if (useWatchDefaults && !isBoolean(useWatchDefaults)) {
      options = useWatchDefaults;
      useWatchDefaults = false;
    }

    // assemble options
    options = Object.assign({}, buildDefaults, useWatchDefaults ? watchDefaults : null, options);
    if (!options.serve) options.open = false;

    // resolve the 'use' calls (of this and even nested Exhibits) into a flat array of builder functions
    const [builders, missingDeps] = resolveBuilders(this);

    // exit with a useful message if any auto-imports failed
    const numMissing = missingDeps.length;
    if (numMissing) {
      let command = `  npm install --save-dev`;
      if (numMissing === 1) command += (' ' + missingDeps[0]);
      else for (const moduleName of missingDeps) command += ' \\\n    ' + moduleName;
      command += '\n';

      console.log(red(`\nFailed to import ${numMissing} builder${numMissing > 1 ? 's' : ''}.`));
      console.log(`\nTry installing ${numMissing > 1 ? 'them' : 'it'} with this command:\n`);
      console.log(green(command));
      process.exit(1);
    }

    // create and run a controller
    this[CONTROLLER] = new Controller({
      originDir,
      destDir,
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
    throw new Error('Cannot call .stop() on Exhibit that is not building.');
  }

  /**
   * length property to make this object array-like
   */
  get length() {
    return this[USE_CALLS].length;
  }
}

/**
 * Gets a new instance.
 */
export default function exhibit() {
  return new Exhibit();
}

/**
 * Get a flat array of builder functions from a given Exhibit.
 * Recursive to allow usage like `.use(otherExhibitInstance)`.
 */
function resolveBuilders(exhibit, builders = [], missingDeps = []) {
  for (let i = 0, l = exhibit.length; i < l; i++) {
    const {args, typeError} = exhibit[i];
    const firstArg = args[0];

    if (isFunction(firstArg)) {
      // .use(fn)
      builders.push(firstArg);
    }
    else if (isString(firstArg)) {
      // .use('foo')
      // auto-import the "exhibit-builder-foo" module (and add to missingDeps if failed)
      if (!validPluginName.test(firstArg)) {
        throw new Error(`Cannot auto-loaded builder with invalid name: ${JSON.stringify(firstArg)}`);
      }
      const moduleName = `exhibit-builder-${firstArg}`;
      let module;
      try {
        module = require(moduleName); // eslint-disable-line global-require
      }
      catch (error) {
        console.log('error', error);
        missingDeps.push(moduleName);
        continue;
      }

      let fns = module.apply(null, args.slice(1));
      if (!isArray(fns)) fns = [fns];
      fns.forEach(fn => {
        if (!isFunction(fn)) throw new Error(`The module ${moduleName} returned an invalid builder.`);
        builders.push(fn);
      });
    }
    else if (isArrayLike(firstArg)) {
      // .use(exhibitInstance)
      // recurse to add the builders from this exhibit
      resolveBuilders(firstArg, builders, missingDeps);
    }
    else {
      console.error('Bad use call');
      throw typeError; // prepared earlier
    }
  }

  return [builders, missingDeps];
}

/**
 * Returns true if obj array-like OR a real array.
 */
function isArrayLike(obj) {
  const {length} = obj;
  return !isFunction(obj) && (
    isArray(obj) ||
    length === 0 ||
    (isNumber(length) && length > 0 && (length - 1) in obj)
  );
}
