import {join, relative, resolve as resolvePath, sep as pathSep, isAbsolute} from 'path';
import browserSyncSnippet from './bundled-plugins/browser-sync-snippet';
import genericImporter from './bundled-plugins/generic-importer';
import {param, ArrayOf, Optional} from 'decorate-this';
import bowerImporter from './bundled-plugins/bower';
import identity from 'lodash/utility/identity';
import isNumber from 'lodash/lang/isNumber';
import BatchRunner from './batch-runner';
import Destination from './destination';
import clearTrace from 'clear-trace';
import {colours} from 'exhibit-core';
import Reporter from './reporter';
import mkdirp from 'mkdirp-then';
import {filter} from 'in-place';
import Promise from 'bluebird';
import Origin from './origin';
import {stat} from 'sander';
import opn from 'opn';

const {red, grey, green, yellow} = colours;

const CWD = Symbol();
const DEST = Symbol();
const ORIGIN = Symbol();
const BUILDERS = Symbol();
const REPORTER = Symbol();
const DEST_DIR = Symbol();
const IMPORTERS = Symbol();
const ORIGIN_DIR = Symbol();
const BUILD_OPTIONS = Symbol();
const CONNECT_SERVER = Symbol();
const BROWSERSYNC_API = Symbol();


export default class Controller {
  constructor(options) {
    this.init(options);
  }

  @param({
    cwd: String,
    originDir: String,
    destDir: String,
    importers: ArrayOf(Function),
    builders: ArrayOf(Function),
    buildOptions: {
      serve: Optional(Boolean), // todo: accept custom options too (port?)
      browserSync: Optional(Boolean), // same here (general BS options)
      watch: Optional(Boolean),
      open: Optional(Boolean),
      verbose: Optional(Boolean),
      autoImporters: Optional(Boolean),
    },
  }, 'Options')
  init({cwd, originDir, destDir, importers, builders, buildOptions}) {
    this[CWD] = cwd;
    this[ORIGIN_DIR] = resolvePath(cwd, originDir);
    this[DEST_DIR] = resolvePath(cwd, destDir);
    this[IMPORTERS] = importers;
    this[BUILDERS] = builders;
    this[BUILD_OPTIONS] = buildOptions;
    this[REPORTER] = null;
    this[ORIGIN] = new Origin(this[ORIGIN_DIR]);
    this[DEST] = new Destination(this[DEST_DIR]);
  }


  async execute() {
    const cwd = this[CWD];
    const originDir = this[ORIGIN_DIR];
    const destDir = this[DEST_DIR];
    const buildOptions = this[BUILD_OPTIONS];
    const originDirRelative = relative(cwd, originDir);
    const destDirRelative = relative(cwd, destDir);

    // ensure destination directory exists (TODO: why are we waiting for it like this?)
    await mkdirp(destDir);

    // start watching the source directory if configured to do so
    // (but no need to wait for it at this point; just get it going)
    const originReady = buildOptions.watch ? this[ORIGIN].watch() : Promise.resolve();

    // find appropriate ports
    const gotPorts = (buildOptions.browserSync || buildOptions.serve) ? (() => {
      const names = [];
      if (buildOptions.serve) names.push('server');
      if (buildOptions.browserSync) names.push('browserSync', 'bsUI', 'weinre');

      return Promise.resolve(
        require('portscanner-plus').getPorts(names.length, 8000, 9000, names) // eslint-disable-line global-require
      ).timeout(3000, 'Timed out scanning for free ports');
    })() : Promise.resolve();

    // get a browser-sync server going (if enabled)
    const browserSyncReady = buildOptions.browserSync ? gotPorts.then(ports => {
      console.assert(isNumber(ports.browserSync));

      const bs = require('browser-sync').create(); // eslint-disable-line global-require
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
    const serverReady = buildOptions.serve ? new Promise((resolve, reject) => {
      gotPorts.then(ports => {
        /* eslint-disable global-require */
        console.assert(isNumber(ports.server));

        const app = require('connect')();
        app.use(require('serve-static')(destDir));

        require('http').createServer(app).listen(ports.server, err => {
          if (err) return reject(err);
          this[CONNECT_SERVER] = app;

          resolve(app);
        });
        /* eslint-enable global-require */
      });
    }) : Promise.resolve();

    // add a generic importer to handle absolute external paths before anything else does
    // (this is necessary for when eg. a sass bower component file imports another file from its own component - we want to handle this quickly without invoking other weirder importers like bower)
    this[IMPORTERS].push(genericImporter());

    // add any auto importers
    const importersReady = buildOptions.autoImporters ? Promise.props({
      bower: (async () => {
        let s;
        try {
          s = await stat(join(cwd, 'bower.json'));
        }
        catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }

        // TODO: also check for .bowerrc here in case it changes
        // the bower_components dir.

        if (s && s.isFile()) {
          this[IMPORTERS].push(bowerImporter(join(cwd, 'bower_components')));
          return true;
        }

        return false;
      })(),
      // later can add other ones here...
    }) : Promise.resolve();

    // prime the source and destination folders (read all their contents from disk)
    const [initialInFiles] = await Promise.join(this[ORIGIN].prime(), this[DEST].prime());
    for (const file of initialInFiles) {
      file.path = resolvePath(originDir, file.path);
    }

    // add the browserSyncSnippet builder if appropriate
    if (buildOptions.browserSync) {
      const ports = await gotPorts;
      this[BUILDERS].push(browserSyncSnippet(ports.browserSync));
    }

    // set up the batch runner (allows us to run successive 'batches' of files to build)
    await importersReady;
    const batchRunner = new BatchRunner({
      cwd,
      originDir,
      controller: this,
      dest: this[DEST],
      importers: this[IMPORTERS],
      builders: this[BUILDERS],
      verbose: buildOptions.verbose,
    });


    // report nicely any errors emitted during a batch
    batchRunner.on('error', error => {
      const reporter = this[REPORTER] || new Reporter().start('Out-of-batch error!');
      reporter.countError();

      reporter.say(); // leave a blank line

      // handle our own builder errors in a useful way
      if (error.code === 'BUILDER_ERROR') {
        const builder = error.builder;
        const originalError = error.originalError;

        const isWarning = originalError && Boolean(originalError.warning);

        reporter.say(
          grey((isWarning ? 'warning' : 'error') + ' from ') + builder.name +
          grey(' while building ') + relative(cwd, error.buildPath) + grey(':')
        );

        // if we've got an original error from the builder, print that
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
      else if (error instanceof Error) {
        reporter.say(red('unknown error:') + '\n' + clearTrace(error));
      }
      else {
        reporter.say(red('non-error thrown:') + '\n' + error);
      }

      reporter.say();

      if (!this[REPORTER]) reporter.end();
    });


    // trigger a browser-sync reload whenever a batch completes
    if (buildOptions.browserSync) {
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
      const serverURL = buildOptions.serve ? `http://localhost:${ports.server}/` : null;
      const bsUIURL = buildOptions.browserSync ? `http://localhost:${ports.bsUI}/` : null;
      if (buildOptions.serve || buildOptions.browserSync || buildOptions.watch) {
        firstReporter.say();

        if (buildOptions.serve) {
          firstReporter.say(
            green('serving ') + grey(destDirRelative + ' at ' + serverURL)
          );
        }

        if (buildOptions.browserSync) {
          firstReporter.say(
            green('browser-sync ') + grey('running at ' + bsUIURL)
          );
        }

        if (buildOptions.watch) {
          firstReporter.say(
            green('watching ') +
            grey(originDirRelative + pathSep + '**')
          );
        }

        if (buildOptions.open) firstReporter.say(green('opening browser'));
      }

      // ensure everything is up and running, then print the first report
      await Promise.all([browserSyncReady, serverReady, originReady]);
      this.endReport();

      // open the server if appropriate
      if (buildOptions.open) opn(serverURL);

      // set up watching: whenever a file changes in the origin,
      // run & report another batch
      if (buildOptions.watch) {
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
   * Closes anything that's keeping the process open.
   */
  stop() {
    const buildOptions = this[BUILD_OPTIONS];

    if (buildOptions.watch) {
      this[ORIGIN].stop();
    }

    if (buildOptions.serve) {
      this[CONNECT_SERVER].close();
    }

    if (buildOptions.browserSync) {
      this[BROWSERSYNC_API].exit();
    }
  }
}
