import path from 'path';
import {readFile} from 'sander';
import subdir from 'subdir';


export default function (bowerComponentsPath = path.join(process.cwd(), 'bower_components')) {
  function exhibitBower(importPath, types) {
    const fullPath = path.resolve(bowerComponentsPath, importPath);

    // if it's not actually in the bower components dir (e.g. because we got an
    // absolute path to somewhere else) then return quickly
    if (!subdir(bowerComponentsPath, fullPath)) return null;

    const accessed = new Set();

    // try just reading it as if it's a direct path to a file within a component
    accessed.add(fullPath);
    return readFile(fullPath)
      .then(contents => {
        return {contents, file: fullPath};
      })
      .catch(error => {
        if (error.code === 'EISDIR') {
          // it's probably pointing at the bower component folder;
          // read its bower.json
          const bowerJSONPath = path.join(fullPath, 'bower.json');
          accessed.add(bowerJSONPath);
          return readFile(bowerJSONPath, 'utf8').then(bowerJSON => {
            try {
              bowerJSON = JSON.parse(bowerJSON);
            }
            catch (e) {
              e.message += ` in ${bowerJSONPath}`;
              throw e;
            }

            if (bowerJSON.main) {
              const mains = (Array.isArray(bowerJSON.main) ? bowerJSON.main : [bowerJSON.main]);

              for (const main of mains) {
                if (!types || !types.length || types.includes(path.extname(main).substring(1))) {
                  const mainFilePath = path.join(fullPath, main);
                  accessed.add(mainFilePath);

                  return readFile(mainFilePath).then(contents => { // eslint-disable-line no-loop-func
                    return {contents, file: mainFilePath};
                  });
                }
              }
            }
          }).catch(e => {
            if (e.code !== 'ENOENT') throw e;
            // rare case - it was probably pointing at a subfolder of a bower
            // component (invalid) or at one without a bower.json (ie. bad
            // component). return nothing.
          });
        }
        else if (error.code !== 'ENOENT') throw error;
      })
      .then((result = {}) => {
        result.accessed = accessed;
        return result;
      });
  }

  // hint for which directory we are concerned with (enables watchLoadPaths, to
  // be implemented in future)
  Object.defineProperty(exhibitBower, 'dir', {value: bowerComponentsPath});

  return exhibitBower;
}
