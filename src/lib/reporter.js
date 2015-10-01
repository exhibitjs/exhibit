import prettyHRTime from 'pretty-hrtime';
import {colours} from 'exhibit-core';
import path from 'path';

const {green, red, grey} = colours;

const CWD = Symbol();
const DEST_DIR = Symbol();
const ORIGIN_DIR = Symbol();
const DEST_DIR_RELATIVE = Symbol();

const indent = '  ';


export default class Reporter {
  constructor({cwd, originDir, destDir}) {
    this[CWD] = cwd;
    this[ORIGIN_DIR] = originDir;
    this[DEST_DIR] = destDir;
    this[DEST_DIR_RELATIVE] = path.relative(cwd, destDir);
    this.errorCount = 0;
  }


  start(headline) {
    this.startTime = process.hrtime();
    console.log('\n' + green('exhibit') + ' ' + grey(headline));
    return this;
  }


  say(what = '', indentLevel=0) {
    for (let line of what.split('\n')) {
      console.log(indent + new Array(indentLevel).join(indent) + line);
    }
  }


  change(change) {
    console.assert(path.isAbsolute(change.path), 'Reporter#change() expects absolute paths; got: ' + change.path);

    this.say(
      green(change.type) + ' ' +
      path.join(this[DEST_DIR_RELATIVE], path.relative(this[ORIGIN_DIR], change.path)) +
      grey(' (' + change.sizeDifference + ')')
    );
  }


  countError() {
    this.errorCount++; // eslint-disable-line space-unary-ops
    // https://github.com/eslint/eslint/issues/2764
  }


  end() {
    const symbol = /*this.errorCount ? '✗' : */'✓';

    console.log(
      indent + (this.errorCount ?
        red(symbol) + grey(` (with ${this.errorCount} error` + (this.errorCount > 1 ? 's)' : ')')) :
        green(symbol)
      ),

      grey(prettyHRTime(process.hrtime(this.startTime))), '\n'
    );
  }
}
