import {resolve as resolvePath, isAbsolute} from 'path';
import {readFile} from 'sander';


export default function (baseDir) {

  function exhibitGenericImporter(path) {
    const {Set} = this;

    const accessed = new Set();
    const result = {accessed};

    if (!baseDir) {
      if (!isAbsolute(path)) return result; // can't handle non-absolute paths without a base dir set
    }
    else path = resolvePath(baseDir, path);

    console.assert(isAbsolute(path), 'should be absolute now');

    accessed.add(path);
    return readFile(path).then(contents => {
      result.contents = contents;
      result.path = path;
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
