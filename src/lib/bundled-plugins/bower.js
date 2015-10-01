import {join, extname, resolve} from 'path';
import {readFile} from 'sander';
import {subdir} from 'exhibit-core';


export default function (bowerComponentsPath = join(process.cwd(), 'bower_components')) {
  function exhibitBower(importPath, types) {
    const {Set} = this;

    const fullPath = resolve(bowerComponentsPath, importPath);

    // if it's not actually in the bower components dir (e.g. because we got an
    // absolute path to somewhere else) then return quickly
    if (!subdir(bowerComponentsPath, fullPath)) return null;

    const accessed = new Set();

    // try just reading it as if it's a direct path to a file within a component
    accessed.add(fullPath);
    return readFile(fullPath)
      .then(contents => {
        return {contents, path: fullPath};
      })
      .catch(error => {
        if (error.code === 'EISDIR') {
          // it's probably pointing at the bower component folder;
          // read its bower.json
          const bowerJSONPath = join(fullPath, 'bower.json');
          accessed.add(bowerJSONPath);
          return readFile(bowerJSONPath, 'utf8').then(bowerJSON => {
            try {
              bowerJSON = JSON.parse(bowerJSON);
            }
            catch (e) {
              e.message += ` in ${bowerJSONPath}`;
              throw e;
            }

            // console.log('BOWER YUP', bowerJSON);

            if (bowerJSON.main) {
              const mains = (Array.isArray(bowerJSON.main) ? bowerJSON.main : [bowerJSON.main]);

              for (const main of mains) {
                // console.log('BOWER TRYING', main);
                if (!types || !types.length || types.indexOf(extname(main).substring(1)) !== -1) {
                  const mainFilePath = join(fullPath, main);
                  accessed.add(mainFilePath);
                  // console.log('BOWER LOADING MAIN FILE', mainFilePath);
                  return readFile(mainFilePath).then(contents => { // eslint-disable-line no-loop-func
                    return {contents, path: mainFilePath};
                  });
                }
                // console.log('BOWER NOPE', main, types, extname(main).substring(1), 'UM');
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
