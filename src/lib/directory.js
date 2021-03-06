import connect from 'connect';
import diff from './diff';
import errorhandler from 'errorhandler';
import http from 'http';
import Immutable from 'immutable';
import matcher from './matcher';
import normalize from './normalize';
import parseFilesize from 'filesize-parser';
import path from 'path';
import prettyBytes from 'pretty-bytes';
import Promise, { promisify } from 'bluebird';
import sander from 'sander';
import sane from 'sane';
import serveIndex from 'serve-index';
import serveStatic from 'serve-static';
import subdir from 'subdir';
import _ from 'lodash';
import { getPorts } from 'portscanner-plus';
import { grey } from 'chalk';

async function pruneEmptyAncestors(file, until) {
  if (until === file || !subdir(until, file)) return;

  file = path.dirname(file); // eslint-disable-line no-param-reassign

  try {
    await sander.rmdir(file);
  }
  catch (error) {
    // for non-empty or missing directories, quietly finish
    if (error.code === 'ENOTEMPTY' || error.code === 'ENOENT') return;
    throw error;
  }

  await pruneEmptyAncestors(file, until);
}

/**
 * Mutates the passed dir object by [re]priming its caches to match the real
 * files on disk.
 */

async function reprime(dir) {
  // start the new files and mtimes caches (eventually to replace the ones on the object)
  const files = {};
  const mtimes = {};

  // define resursive function to load directory contents
  let totalSize = 0;
  const load = dirName => Promise.map(sander.readdir(dirName), async _name => {
    const name = path.resolve(dirName, _name);
    const relativeName = path.relative(dir._absolutePath, name);

    // find out when the file last changed on disk
    const stat = await sander.lstat(name);
    const diskMtime = stat.mtime.getTime();

    // find out when our cached copy last changed (if any)
    const lastKnownMtime = dir._mtimes.get(relativeName);

    if (stat.isFile()) {
      // skip this file if it's excluded by the matcher
      if (!dir._match(relativeName)) return;

      // get the cached content (if any)
      const cachedContent = dir._files.get(relativeName);

      // decide what we're going to go with (the one from the cache or the one on disk)
      let content;
      let mtime;
      // console.log('\nfile', name);
      // console.log('  lastKnownMtime', lastKnownMtime);
      // console.log('       diskMtime', diskMtime);
      // console.log();

      if (cachedContent && diskMtime <= lastKnownMtime) {
        // cached file exists and is new enough; use it
        // console.log('cache hit!!', relativeName);
        mtime = lastKnownMtime;
        content = cachedContent;
      }
      else {
        // no cached file (or too old); read the file from disk
        // console.log('cache miss:', relativeName);
        mtime = diskMtime;
        content = await sander.readFile(name);
      }

      // verify adding this file doesn't take us over the filesize limit
      totalSize += content.length;
      if (totalSize > dir._limit) {
        throw new Error(
          `Contents of directory exceed ${prettyBytes(dir._limit)} limit: ${dir._absolutePath}`
          );
      }

      // update the new caches with this file's content and mtime
      files[relativeName] = content;
      mtimes[relativeName] = mtime;
    }

    // if it's a directory, recurse into it
    else if (stat.isDirectory()) await load(name);

    // if it's something weird, error out
    else throw new Error(`Not a file or directory: ${name}`);
  });

  // start recursive load
  try {
    await load(dir._absolutePath);
  }
  catch (error) {
    // create the base directory if it doesn't exist
    if (error.code === 'ENOENT' && error.path === dir._absolutePath) {
      await sander.mkdir(dir._absolutePath);
    }
    else throw error;
  }

  // save the new caches and note that the directory has been primed
  /* eslint-disable no-param-reassign */
  dir._files = Immutable.Map(files);
  dir._mtimes = Immutable.Map(mtimes);
  dir._primed = true;
  /* eslint-enable no-param-reassign */
}

const defaults = {
  match: '**',
  limit: '10MB',
  log: false,
};

let queueableMethods;

/**
 * A Directory instance represents a real directory on disk and acts as an
 * in-memory cache of its entire contents.
 */

export class Directory {
  constructor(name, _options) {
    const dir = this;

    const options = Object.assign({}, defaults, _options);

    // settings
    dir._absolutePath = path.resolve(name);
    dir._match = matcher(options.match);
    dir._limit = parseFilesize(options.limit);
    dir._log = Boolean(options.log);
    dir._logPrelude = grey(path.relative(process.cwd(), dir._absolutePath)) + path.sep;

    if (options.force !== true && !subdir(process.cwd(), dir._absolutePath)) {
      throw new Error("exhibit: Cannot work outside CWD unless you enable the 'force' option");
    }

    // facts about temporal state
    dir._watcher = null; // sane watcher, if active
    dir._primed = false; // whether there's anything in the cache

    // intialise caches
    dir._files = Immutable.Map(); // [fileName: content]
    dir._mtimes = Immutable.Map(); // [fileName: mtime]

    // add all the faux-decorated 'queueable' methods
    for (const methodName of Object.keys(queueableMethods)) {
      const method = queueableMethods[methodName];

      Object.defineProperty(dir, methodName, {
        value() {
          const args = arguments;

          dir._queuedOperations = Promise.resolve(dir._queuedOperations)
            .then(() => method.apply(dir, args));

          return dir._queuedOperations;
        },
      });
    }
  }

  /**
   * Synchronous method to retrieve the files cache as it stands, without revalidating
   * against the disk. Throws if this directory has never been primed.
   */

  getCache() {
    if (!this._primed) throw new Error('exhibit: Directory has never been primed.');
    return this._files;
  }
}

// later, the following methods will be moved into the class definition and decorated
// with `@queuable`, but for now Babel v6 doesn't support decorators
queueableMethods = { // eslint-disable-line prefer-const

  /**
   * Reads the contents of the directory, recursively, but cached.
   */

  async read(incomingFiles) {
    const dir = this; // until babel bugs resolved

    // return from cache immediately if we know this dir is being kept up to date
    if (dir._watching) return dir._files;

    await reprime(dir);

    // in case this read() is being used as a builder, merge with the incoming files
    if (incomingFiles) return normalize(incomingFiles).merge(dir._files);

    // return the map of files
    return dir._files;
  },


  /**
   * Writes a filemap to disk.
   */

  async write(incomingFiles) {
    const dir = this;

    if (dir._watching) throw new Error('exhibit: Cannot write to watched directory');

    // [re]prime this directory, unless it's being kept up to date automatically
    if (!dir._watching) await reprime(dir);

    // see what changes are needed
    const patch = diff(dir._files, incomingFiles);
    const patchKeys = patch.keys();

    // start some mutatable objects based on our existing caches (eventually to replace them)
    const newFiles = dir._files.toObject();
    const newMtimes = dir._mtimes.toObject();

    // note deleted paths (so we can prune empty dirs after deleting the files)
    const deletions = new Set();

    // go through all patch paths in parallel
    await Promise.map(patchKeys, async name => {
      const content = patch.get(name);

      if (content === null) {
        // the patch says we should delete this file.
        deletions.add(name);
        delete newFiles[name];

        await sander.unlink(dir._absolutePath, name);
        if (dir._log) console.log(` → delete ${dir._logPrelude}${name}`);
      }
      else {
        // the patch says this file has changed.
        // write the file to disk
        await sander.writeFile(dir._absolutePath, name, content);
        if (dir._log) console.log(` →  write ${dir._logPrelude}${name}`);

        // then set our new caches
        newMtimes[name] = Date.now(); // nb. must record time after writing, not before
        newFiles[name] = content;
      }
    });

    // now all files are deleted, prune any empty directories in series
    for (const deletion of deletions) {
      await pruneEmptyAncestors(
        path.resolve(dir._absolutePath, deletion),
        dir._absolutePath
      );
    }

    // update our files cache
    const files = Immutable.Map(newFiles);
    const mtimes = Immutable.Map(newMtimes);

    dir._files = files;
    dir._mtimes = mtimes;

    return files;
  },

  /**
   * Starts watching the directory and calls your subscriber whenever things change.
   */

  async watch(subscriber, options) {
    const dir = this;
    if (dir._watcher) throw new Error('Already watching');

    await reprime(dir);

    const notify = _.debounce(() => {
      // TODO: debounce again, queueing up changes
      subscriber(dir._files);
    }, 10);

    const onWatchEvent = async (name, root, stat) => {
      if (!dir._match(name)) return;

      if (!stat) {
        if (dir._log) console.log('delete', dir._logPrelude + name);

        dir._files = dir._files.delete(name);
        dir._mtimes = dir._mtimes.delete(name);
        notify();
      }
      else if (stat.isFile()) {
        if (dir._log) console.log('edit', dir._logPrelude + name);

        dir._mtimes = dir._mtimes.set(name, stat.mtime.getTime());
        dir._files = dir._files.set(name, await sander.readFile(root, name));
        notify();
      }
    };

    const watcher = sane(dir._absolutePath, options);

    watcher.on('add', onWatchEvent);
    watcher.on('change', onWatchEvent);
    watcher.on('delete', onWatchEvent);
    dir._watcher = watcher;

    return new Promise((resolve, reject) => {
      watcher.on('error', reject);

      watcher.on('ready', async () => {
        await reprime(dir);
        await Promise.resolve(notify());
        resolve();
      });
    });
  },

  /**
   * Starts a simple dev server.
   */

  async serve() {
    const dir = this;

    const [serverPort] = await getPorts(1, 8000, 9000);

    const app = connect();
    app.use(serveStatic(dir._absolutePath));
    app.use(errorhandler());
    app.use(serveIndex(dir._absolutePath, { icons: true, hidden: true, view: 'details' }));

    const server = http.createServer(app);

    await promisify(server.listen.bind(server))(serverPort);

    console.log(`Serving ${path.relative(process.cwd(), dir._absolutePath)} at http://localhost:${serverPort}/`);
  },
};

/**
 * Main public interface: a convenience function for making a new instance
 * (with some path-joining sugar).
 */

export default function directory(...args) {
  const options = typeof args[args.length - 1] === 'string' ? undefined : args.pop();

  return new Directory(path.resolve.apply(null, args), options);
}
