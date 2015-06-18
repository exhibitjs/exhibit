/**
 * Miscellaneous library functions, promisified.
 */

import {promisify} from 'bluebird';
import {fs} from 'exhibit-core';
import mkdirp from 'mkdirp';

export default {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  unlink: promisify(fs.unlink),
  readdir: promisify(fs.readdir),
  lstat: promisify(fs.lstat),
  mkdirp: promisify(mkdirp),
};
