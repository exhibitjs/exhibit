import {param, promises, Optional, ArrayOf} from 'decorate-this';
import {Change} from 'exhibit-core';
import {isAbsolute} from 'path';
import {filter} from 'in-place';
import Promise from 'bluebird';
import Cache from './cache';


export default class Destination extends Cache {
  constructor (diskDir) {
    super(diskDir);
  }


  /**
   * Overrides prime just so we can also make a note of which dirs already exist.
   */
  @promises( ArrayOf( Change ) )

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
  @param( Optional( ArrayOf( String ) ) )
  @promises( ArrayOf( Change ) )

  purgeAllExcept(exceptPaths) {
    console.assert(exceptPaths.every(path => !isAbsolute(path)));

    const paths = this.getAllPaths();
    // console.log('all paths', paths);

    if (exceptPaths) filter(paths, path => exceptPaths.indexOf(path) === -1);

    // console.log('exceptPaths (initial writes)', exceptPaths);
    // console.log('remaining paths', paths);

    return Promise.map(paths, path => this.write(path, null));
  }
}
