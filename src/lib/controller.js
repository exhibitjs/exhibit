import {join, relative, resolve as resolvePath, sep as pathSep} from 'path';
import exhibitBrowserSyncSnippet from './exhibit-browser-sync-snippet';
import {colours, isAbsolute} from 'exhibit-core';
import identity from 'lodash/utility/identity';
import isNumber from 'lodash/lang/isNumber';
import Destination from './destination';
import BatchRunner from './batch-runner';
import clearTrace from 'clear-trace';
import {mkdirp} from './promisories';
import Reporter from './reporter';
import {filter} from 'in-place';
import Promise from 'bluebird';
import Origin from './origin';
import opn from 'opn';

const {red, grey, green, yellow} = colours;

const CWD = Symbol();
const DEST = Symbol();
const ORIGIN = Symbol();
const OPTIONS = Symbol();
const PLUGINS = Symbol();
const REPORTER = Symbol();
const DEST_DIR = Symbol();
const ORIGIN_DIR = Symbol();
const LOAD_PATHS = Symbol();
const CONNECT_SERVER = Symbol();
const BROWSERSYNC_API = Symbol();


export default class Controller {
  constructor({cwd, originDir, destDir, loadPaths, plugins, options}) {
    this[CWD] = cwd;
    this[ORIGIN_DIR] = resolvePath(cwd, originDir);
    this[DEST_DIR] = resolvePath(cwd, destDir);
    this[LOAD_PATHS] = loadPaths.map(loadPath => resolvePath(cwd, loadPath));
    this[PLUGINS] = plugins;
    this[OPTIONS] = options;
    this[REPORTER] = null;
    this[ORIGIN] = new Origin(this[ORIGIN_DIR]);
    this[DEST] = new Destination(this[DEST_DIR]);
  }



  async execute() {
    const cwd = this[CWD];
    const originDir = this[ORIGIN_DIR];
    const destDir = this[DEST_DIR];
    const options = this[OPTIONS];
    const originDirRelative = relative(cwd, originDir);
    const destDirRelative = relative(cwd, destDir);

    // ensure destination directory exists (TODO: why are we waiting for it like this?)
    await mkdirp(destDir);

    // start watching the source directory if configured to do so
    // (but no need to wait for it at this point; just get it going)
    const originReady = options.watch ? this[ORIGIN].watch() : Promise.resolve();

    // find appropriate ports
    const gotPorts = (options.browserSync || options.serve) ? (() => {
      const names = [];
      if (options.serve) names.push('server');
      if (options.browserSync) names.push('browserSync', 'bsUI', 'weinre');

      return Promise.resolve(
        require('portscanner-plus').getPorts(names.length, 8000, 9000, names)
      ).timeout(3000, 'Timed out scanning for free ports');
    })() : Promise.resolve();

    // get a browser-sync server going (if enabled)
    const browserSyncReady = options.browserSync ? gotPorts.then(ports => {
      console.assert(isNumber(ports.browserSync));

      const bs = require('browser-sync').create();
      this[BROWSERSYNC_API] = bs;

      const bsOptions = {
        logLevel: 'silent',
        port: ports.browserSync,
        ui: {
          port: ports.bsUI,
          weinre: {
            port: ports.weinre,
          },
        },
      };

      return Promise.promisify(bs.init).call(bs, bsOptions)
        .timeout(12000, 'Timed out initialising BrowserSync server')
        .return(bs);
    }) : Promise.resolve();

    // and get a connect server going for the destDir (if enabled)
    const serverReady = options.serve ? new Promise((resolve, reject) => {
      gotPorts.then(ports => {
        console.assert(isNumber(ports.server));

        const app = require('connect')();
        app.use(require('serve-static')(destDir));

        require('http').createServer(app).listen(ports.server, err => {
          if (err) return reject(err);
          this[CONNECT_SERVER] = app;

          resolve(app);
        });
      });
    }) : Promise.resolve();


    // prime the source and destination folders (read all their contents from disk)
    const [initialInFiles] = await Promise.join(this[ORIGIN].prime(), this[DEST].prime());
    for (const file of initialInFiles) {
      file.path = resolvePath(originDir, file.path);
    }

    // add the browserSyncSnippet plugin if appropriate
    if (options.browserSync) {
      const ports = await gotPorts;
      this[PLUGINS].push(exhibitBrowserSyncSnippet(ports.browserSync));
    }

    // set up the batch runner (allows us to run successive 'batches' of files to build)
    const batchRunner = new BatchRunner({
      cwd,
      originDir,
      controller: this,
      dest: this[DEST],
      loadPaths: this[LOAD_PATHS],
      plugins: this[PLUGINS],
      verbose: options.verbose,
    });


    // report nicely any errors emitted during a batch
    batchRunner.on('error', error => {
      const reporter = this[REPORTER] || new Reporter().start('Out-of-batch error!');
      reporter.countError();

      reporter.say(); // leave a blank line

      // handle our own plugin errors in a useful way
      if (error.code === 'PLUGIN_ERROR') {
        const plugin = error.plugin;
        const originalError = error.originalError;

        const isWarning = originalError && !!originalError.warning;

        reporter.say(
          grey((isWarning ? 'warning' : 'error') + ' from ') + plugin.name +
          grey(' building ' + relative(cwd, error.buildPath) + ':')
        );

        // if we've got an original error from the plugin, print that
        if (originalError) {
          if (originalError.code === 'SOURCE_ERROR') {
            const errorColour = isWarning ? yellow : red;

            reporter.say('\n' + errorColour(originalError.message), 2);
            if (originalError.path) {

              reporter.say(
                '\n' + errorColour(relative(cwd, originalError.path) +
                  originalError.pathSuffix),
                2
              );
            }
            reporter.say(originalError.excerpt, 2);
          }
          else {
            reporter.say(clearTrace(error.originalError), 2);
          }
        }
        // otherwise just print the emitted error
        else {
          reporter.say(clearTrace(error), 2);
        }
      }

      // handle any other errors generically
      else {
        if (error instanceof Error) {
          reporter.say(red('unknown error:') + '\n' + clearTrace(error));
        }
        else {
          reporter.say(red('non-error thrown:') + '\n' + error);
        }
      }

      reporter.say();

      if (!this[REPORTER]) reporter.end();
    });


    // trigger a browser-sync reload whenever a batch completes
    if (options.browserSync) {
      batchRunner.on('batch-complete', writtenChanges => {
        browserSyncReady.then(bs => {
          bs.reload(writtenChanges.map(change => change.path));
        });
      });
    }


    // run the first batch...
    {
      // capture all destination writes that occur during the first batch
      // (so afterwards we can decide which files, if any, to delete)
      const initialWrites = [];
      const destWritesListener = path => {
        initialWrites.push(path);
      };
      this[DEST].on('writing', destWritesListener);

      // run the first batch now, with manual reporting
      const firstReporter = this.startReport(join(originDirRelative, '**', '*'));
      const changes = await batchRunner.run({files: initialInFiles, autoReport: false, deferrable: false})
        .catch(error => {
          console.error(red('Unhandled exception from initial batch'));
          console.error(error.stack);
        });

      if (changes) {
        console.assert(
          changes.every(change => isAbsolute(change.path)),
          'Expected all changes from BatchRuner#run() to have absolute paths'
        );
      }

      // stop listening for writes; do initial deletions
      this[DEST].removeListener('writing', destWritesListener);
      const initialDeletions = await this[DEST].purgeAllExcept(initialWrites);

      // report events from the first batch
      if (firstReporter.errorCount) firstReporter.say();

      if (changes) {
        changes.forEach(change => firstReporter.change(change));
      }
      if (initialDeletions) {
        filter(initialDeletions, identity);

        initialDeletions.forEach(change => {
          change.path = resolvePath(originDir, change.path);
          firstReporter.change(change);
        });
      }

      if (!changes && !initialDeletions) {
        firstReporter.say(grey('[no changes]'));
      }

      // complete the report, inc. special first-batch extras
      const ports = await gotPorts;
      const serverURL = options.serve ? `http://localhost:${ports.server}/` : null;
      const bsUIURL = options.browserSync ? `http://localhost:${ports.bsUI}/` : null;
      if (options.serve || options.browserSync || options.watch) {
        firstReporter.say();

        if (options.serve) {
          firstReporter.say(
            green('serving ') + grey(destDirRelative + ' at ' + serverURL)
          );
        }

        if (options.browserSync) {
          firstReporter.say(
            green('browser-sync ') + grey('running at ' + bsUIURL)
          );
        }

        if (options.watch) {
          firstReporter.say(
            green('watching ') +
            grey(originDirRelative + pathSep + '**')
          );
        }

        if (options.open) firstReporter.say(green('opening browser'));
      }

      // ensure everything is up and running, then print the first report
      await Promise.all([browserSyncReady, serverReady, originReady]);
      this.endReport();

      // open the server if appropriate
      if (options.open) opn(serverURL);

      // set up watching: whenever a file changes in the origin,
      // run & report another batch
      if (options.watch) {
        const bufferedChanges = [];
        let bufferTimeout;

        this[ORIGIN].on('change', change => {
          // changes coming from the origin will be relative, so make them absolute
          change.path = resolvePath(originDir, change.path);

          // buffer up changes that are very close together, then run them as a batch
          if (bufferTimeout) clearTimeout(bufferTimeout);
          bufferedChanges.push(change);
          bufferTimeout = setTimeout(() => {
            batchRunner.run({files: bufferedChanges.slice()})
              .catch(error => {
                console.error(red('Unhandled exception from watch-driven batch'));
                console.error(error.stack);
              });
            bufferedChanges.length = 0;
          }, 5);
        });
      }

      // relativise the paths of the final changes before returning
      if (changes) {
        for (const change of changes) {
          console.assert(isAbsolute(change.path));
          change.path = relative(originDir, change.path);
        }
      }

      // resolve the initial `.build()` call with the changes
      return changes || null;
    }
  }



  startReport(headline) {
    if (this[REPORTER]) throw new Error('Reporter already exists');

    this[REPORTER] = new Reporter({
      cwd: this[CWD],
      originDir: this[ORIGIN_DIR],
      destDir: this[DEST_DIR],
    }).start(headline);

    return this[REPORTER];
  }



  endReport(symbol) {
    this[REPORTER].end(symbol);
    delete this[REPORTER];
  }



  /**
   * Closes everything that's keeping the process open.
   */
  stop() {
    const options = this[OPTIONS];

    if (options.watch) {
      this[ORIGIN].stop();
    }

    if (options.serve) {
      this[CONNECT_SERVER].close();
    }

    if (options.browserSync) {
      this[BROWSERSYNC_API].exit();
    }
  }
}
