import assign from 'lodash/object/assign';
import {readFile} from 'sander';
import Promise from 'bluebird';
import Cache from './cache';
import sane from 'sane';
import path from 'path';

const WATCHER = Symbol();
const DISK_DIR = Symbol();
const WATCH_CALLED = Symbol();

const saneDefaults = {
  watchman: false,
  poll: false,
  dot: true,
};


export default class Origin extends Cache {
  constructor(diskDir) {
    super(diskDir);

    this[DISK_DIR] = diskDir; // nb we are keeping this here as well as in cache
    this[WATCH_CALLED] = false;
  }


  async watch() {
    try {
      if (this[WATCH_CALLED]) {
        throw new Error('Cannot call watch twice');
      }
      this[WATCH_CALLED] = true;

      this[WATCHER] = sane(this[DISK_DIR], assign({}, saneDefaults, this.options));


      // listen to all event types
      ['change', 'add', 'delete'].forEach(type => {
        this[WATCHER].on(type, (file, root, stat) => {
          if (path.basename(file) === '.DS_Store') return;

          console.assert(!path.isAbsolute(file));

          if (!stat) {
            // the file on disk has been deleted.
            console.assert(type === 'delete', `unexpected type: ${type}`);
            this.writeWithoutPersisting(file, null);
          }

          else if (stat.isFile()) {
            // the file on disk has been modified or created.
            console.assert(type === 'change' || type === 'add', `unexpected type: ${type}`);

            const absPath = path.resolve(this[DISK_DIR], file);

            readFile(absPath).then(contents => {
              this.writeWithoutPersisting(file, contents);
            }).catch(error => {
              if (error.code === 'ENOENT') this.writeWithoutPersisting(file, null);
              else {
                // we could not read the file because of permissions or some other issue.
                // since we're in limbo here, we can only print the error
                console.error(`\nFailed to read file after change: ${file}\n${error.stack}\n`);
              }
            });
          }
        });
      });

      await new Promise((resolve, reject) => {
        this[WATCHER].on('ready', resolve);
        this[WATCHER].on('error', reject);
      });
    }

    catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Origin directory not found: ' + this[DISK_DIR]);
      }
      throw error;
    }
  }


  /**
   * Close filesystem watcher so the process can exit.
   */
  stop() {
    this[WATCHER].close();
  }
}
