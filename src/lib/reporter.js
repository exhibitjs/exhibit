import prettyHRTime from 'pretty-hrtime';
import {colours} from 'exhibit-core';
import path from 'path';

const CWD = Symbol();
const DEST_DIR = Symbol();
const ORIGIN_DIR = Symbol();
const DEST_DIR_RELATIVE = Symbol();

const {green, red, grey} = colours;
const indent = '  ';

export default class Reporter {
  constructor({cwd, originDir, destDir}) {
    this[CWD] = cwd;
    this[ORIGIN_DIR] = originDir;
    this[DEST_DIR] = destDir;
    this[DEST_DIR_RELATIVE] = path.relative(cwd, destDir);

    Object.defineProperty(this, 'errors', {value: []});
  }

  start(headline) {
    this.startTime = process.hrtime();
    console.log('\n' + green('read') + ' ' + grey(headline));
    return this;
  }

  say(what = '', indentLevel = 0) {
    for (let line of what.split('\n')) {
      console.log(indent + new Array(indentLevel).join(indent) + line);
    }
  }

  change(change) {
    console.assert(path.isAbsolute(change.file), 'Reporter#change() expects absolute paths; got: ' + change.file);

    this.say(
      green(change.type) + ' ' +
      path.join(this[DEST_DIR_RELATIVE], path.relative(this[ORIGIN_DIR], change.file)) +
      grey(' (' + change.sizeDifference + ')')
    );
  }

  end() {
    console.log(
      indent + (this.errorCount ?
        red('✓') + grey(` (with ${this.errorCount} error` + (this.errorCount > 1 ? 's)' : ')')) :
        green('✓')
      ),

      grey(prettyHRTime(process.hrtime(this.startTime))), '\n'
    );
  }
}
