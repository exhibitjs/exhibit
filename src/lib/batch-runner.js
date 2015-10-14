import {relative, resolve as resolvePath, isAbsolute} from 'path';
import identity from 'lodash/utility/identity';
import {Engine, colours} from 'exhibit-core';
import {EventEmitter} from 'events';
import {filter} from 'in-place';
import Promise from 'bluebird';

const {grey, red} = colours;

const ENGINE = Symbol();
const DEFERRED = Symbol();
const RUNNING = Symbol();
const DEST = Symbol();
const ORIGIN_DIR = Symbol();
const CONTROLLER = Symbol();
const CWD = Symbol();

export default class BatchRunner extends EventEmitter {
  constructor({cwd, originDir, importers, builders, controller, dest, verbose}) {
    super();

    console.assert(typeof originDir === 'string', 'should be stirng');

    // make an exhibit engine, which this batchrunner will use for every batch
    this[ENGINE] = new Engine({
      base: originDir,
      builders,
      verbose,
      importers,
    });

    this[ENGINE].on('error', error => {
      this.emit('error', error);
    });

    this[CONTROLLER] = controller;
    this[ORIGIN_DIR] = originDir;
    this[DEST] = dest;
    this[CWD] = cwd;
    this[DEFERRED] = [];
    this[RUNNING] = false;
  }


  async run({files, autoReport = true, deferrable = true}) {
    let reporter, writtenChanges;

    if (!files.every(file => isAbsolute(file.file))) {
      console.error('files passed to Batch#run():', files);
      throw new Error('Files passed to Batch#run() must have absolute paths');
    }

    // if already running, just collect up the files for another batch to run afterwards
    if (this[RUNNING]) {
      if (!deferrable) {
        throw new Error(
          'Cannot run a non-deferrable batch while a batch is already running.'
        );
      }

      files.forEach(file => {
        // in case two changes to the same file occur in quick succession, keep only the latest one
        filter(this[DEFERRED], t => t.file !== file.file);
        this[DEFERRED].push(file);
      });

      return null;
    }

    this[RUNNING] = true;

    if (autoReport) {
      reporter = this[CONTROLLER].startReport(
        files.map(file => relative(this[CWD], file.file)).join(', ')
      );
    }


    // make and run a batch
    const changes = await this[ENGINE].batch(files);

    console.assert(
      changes.every(change => isAbsolute(change.file)),
      'Expected all changes from Engine#batch() to have absolute paths'
    );

    // write the changes out to the disk
    if (changes) {
      writtenChanges = await Promise.map(changes, change => {
        if (change) {
          return this[DEST].write(
            relative(this[ORIGIN_DIR], change.file),
            change.contents
          );
        }
      });
    }

    // exclude nulls
    filter(writtenChanges, identity);

    // convert them to absolute paths
    // (as these ones came from dest, they have relative paths)
    for (const change of writtenChanges) {
      change.file = resolvePath(this[ORIGIN_DIR], change.file);
    }

    // finish the report
    if (autoReport) {
      if (reporter.errorCount) reporter.say();

      if (writtenChanges.length) {
        for (const change of writtenChanges) {
          reporter.change(change);
        }

        // emit an event so the controller can notify browser-sync
        this.emit('batch-complete', writtenChanges);
      }
      else reporter.say(grey('[no changes]'));

      this[CONTROLLER].endReport();
    }

    // if any more files were deferred during that batch, run another one
    this[RUNNING] = false;
    if (this[DEFERRED].length) {
      const nextTriggers = [].concat(this[DEFERRED]);
      this[DEFERRED].length = 0;
      setImmediate(() => {
        this.run({files: nextTriggers}).catch(error => {
          console.error(red('Unhandled exception from deferred batch'));
          console.error(error.stack);
        });
      });
    }

    console.assert(
      writtenChanges.every(change => isAbsolute(change.file)),
      'writtenChanges should all have absolute paths here'
    );

    return writtenChanges;
  }
}
