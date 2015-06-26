import {basename, resolve as resolvePath, normalize, dirname, relative} from 'path';
import {lstat, readFile, readdir, writeFile, unlink, mkdirp} from './promisories';
import {VirtualFolder, isAbsolute} from 'exhibit-core';
import Promise from 'bluebird';

const DISK_DIR = Symbol();
const PRIMED = Symbol();
const EXISTING_DIR_PROMISES = Symbol();


/**
 * Traverses and loads all contents of all files under `dir`.
 * (Probably should be made safer, e.g. cap how many files/bytes etc, probably controlled by options.)
 */
const recursiveLoadDir = async (dir) => {
  const finalResults = {};

  await Promise.map(readdir(dir), async path => {
    if (basename(path) === '.DS_Store') return;

    path = resolvePath(dir, path);

    const stat = await lstat(path);

    if (stat.isFile()) {
      finalResults[path] = await readFile(path);
    }
    else if (stat.isDirectory()) {
      const results = await recursiveLoadDir(path);
      Object.keys(results).forEach(path2 => finalResults[path2] = results[path2]);
    }
    else throw new Error('Not sure what to do for file ' + path);
  });

  return finalResults;
};


export default class Cache extends VirtualFolder {
  constructor(diskDir) {
    super();
    this[DISK_DIR] = diskDir;
    this[PRIMED] = false;
    this[EXISTING_DIR_PROMISES] = {
      '.': Promise.resolve(),
    };
  }


  async prime() {
    const cache = this;

    if (cache[PRIMED]) throw new Error('Cannot prime twice');
    cache[PRIMED] = true;

    const results = await recursiveLoadDir(cache[DISK_DIR]);

    return Promise.map(
      Object.keys(results),
      path => {
        console.assert(isAbsolute(path), 'Expected recursiveLoadDir() to return only absolute paths; got: ' + path);

        return super.write(relative(this[DISK_DIR], path), results[path]);
      }
    );
  }


  /**
   * Sets the contents for `path` and persists any resulting change
   * to disk.
   */
  async write(path, contents) {
    console.assert(!isAbsolute(path), 'Do not write absolute paths to Cache instances.');

    this.emit('writing', path);

    const change = super.write(path, contents);

    if (change) {
      const absolutePath = resolvePath(this[DISK_DIR], change.path);


      if (change.type === 'delete') {
        await unlink(absolutePath);
        // todo: delete directory too if it's now empty
      }
      else {
        await this.ensureDirExists(dirname(change.path));
        await writeFile(absolutePath, change.contents);
      }
    }

    return change;
  }


  /**
   * Allows setting the in-memory virtual folder contents without persisting
   * to disk.
   */
  async writeWithoutPersisting(path, contents) {
    console.assert(!isAbsolute(path), 'Do not write absolute paths to Cache instances.');

    return super.write(path, contents);
  }



  ensureDirExists(dir) {
    const destination = this;
    dir = normalize(dir);

    if (!destination[EXISTING_DIR_PROMISES][dir]) {
      destination[EXISTING_DIR_PROMISES][dir] = mkdirp(resolvePath(this[DISK_DIR], dir));
    }

    return destination[EXISTING_DIR_PROMISES][dir];
  }
}
