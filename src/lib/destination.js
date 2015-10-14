import {param, promises, Optional, ArrayOf} from 'decorate-this';
import {Change} from 'exhibit-core';
import path from 'path';
import {filter} from 'in-place';
import Promise from 'bluebird';
import Cache from './cache';

export default class Destination extends Cache {
  constructor(diskDir) {
    super(diskDir);
  }

  /**
   * Overrides prime just so we can also make a note of which dirs already exist.
   */
  @promises(ArrayOf(Change))
  async prime() {
    return super.prime().then(initialChanges => {
      // initialChanges.forEach(change => {
      //   // todo: add Promise.resolve() for all dirs leading to this file in destination[EXISTING_DIR_PROMISES]
      // });

      return initialChanges;
    });
  }

  /**
   * Deletes (from disk) all files except those specified.
   */
  @param(Optional(ArrayOf(String)))
  @promises(ArrayOf(Change))
  purgeAllExcept(exceptFiles) {
    console.assert(exceptFiles.every(file => !path.isAbsolute(file)));

    const files = this.getAllPaths();
    // console.log('all paths', files);

    if (exceptFiles) filter(files, file => exceptFiles.indexOf(file) === -1);

    // console.log('exceptFiles (initial writes)', exceptFiles);
    // console.log('remaining paths', files);

    return Promise.map(files, file => this.write(file, null));
  }
}
