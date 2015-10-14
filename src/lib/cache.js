import path from 'path';
import {lstat, readFile, readdir, writeFile, unlink} from 'sander';
import {VirtualFolder} from 'exhibit-core';
import mkdirp from 'mkdirp-then';
import Promise from 'bluebird';

const PRIMED = Symbol();
const DISK_DIR = Symbol();
const EXISTING_DIR_PROMISES = Symbol();


/**
 * Traverses and loads all contents of all files under `dir`.
 */
const recursiveLoadDir = async dir => {
  // TODO: make this safer, eg. cap how many files/bytes etc, probably controlled by .build() options.
  const finalResults = {};

  await Promise.map(readdir(dir), async file => {
    if (path.basename(file) === '.DS_Store') return;

    file = path.resolve(dir, file);

    const stat = await lstat(file);

    if (stat.isFile()) {
      finalResults[file] = await readFile(file);
    }
    else if (stat.isDirectory()) {
      const results = await recursiveLoadDir(file);
      Object.keys(results).forEach(file2 => finalResults[file2] = results[file2]);
    }
    else throw new Error('Not sure what to do for file ' + file);
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

  /**
   * Instruct the cache to prime itself by loading in all contents from the disk directory.
   */
  async prime() {
    const cache = this;

    if (cache[PRIMED]) throw new Error('Cannot prime twice');
    cache[PRIMED] = true;

    const results = await recursiveLoadDir(cache[DISK_DIR]);

    return Promise.map(
      Object.keys(results),
      file => {
        console.assert(path.isAbsolute(file), 'Expected recursiveLoadDir() to return only absolute paths; got: ' + file);

        return super.write(path.relative(this[DISK_DIR], file), results[file]);
      }
    );
  }


  /**
   * Sets the contents for `file` and persists any resulting change
   * to disk.
   */
  async write(file, contents) {
    console.assert(!path.isAbsolute(file), 'Do not write absolute paths to Cache instances.');

    this.emit('writing', file);

    const change = super.write(file, contents);

    if (change) {
      const absolutePath = path.resolve(this[DISK_DIR], change.file);


      if (change.type === 'delete') {
        await unlink(absolutePath);
        // todo: delete directory too if it's now empty
      }
      else {
        await this.ensureDirExists(path.dirname(change.file));
        await writeFile(absolutePath, change.contents);
      }
    }

    return change;
  }


  /**
   * Allows setting the in-memory virtual folder contents without persisting
   * to disk.
   */
  async writeWithoutPersisting(file, contents) {
    console.assert(!path.isAbsolute(file), 'Do not write absolute paths to Cache instances.');

    return super.write(file, contents);
  }


  ensureDirExists(dir) {
    const destination = this;
    dir = path.normalize(dir);

    if (!destination[EXISTING_DIR_PROMISES][dir]) {
      destination[EXISTING_DIR_PROMISES][dir] = mkdirp(path.resolve(this[DISK_DIR], dir));
    }

    return destination[EXISTING_DIR_PROMISES][dir];
  }
}
