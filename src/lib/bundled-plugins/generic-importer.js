import {readFile} from 'sander';
import path from 'path';

export default function (baseDir) {
  function exhibitGenericImporter(file) {
    const accessed = new Set();
    const result = {accessed};

    if (!baseDir) {
      if (!path.isAbsolute(file)) return result; // can't handle non-absolute paths without a base dir set
    }
    else file = path.resolve(baseDir, file);

    console.assert(path.isAbsolute(file), 'should be absolute now');

    accessed.add(file);

    return readFile(file).then(contents => {
      result.contents = contents;
      result.file = file;
      return result;
    }).catch(error => {
      if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
      return result;
    });
  }

  if (baseDir) {
    Object.defineProperty(exhibitGenericImporter, 'dir', {value: baseDir});
  }

  return exhibitGenericImporter;
}
