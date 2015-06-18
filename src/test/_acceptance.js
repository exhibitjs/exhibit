// import assert from 'assert';
// import Promise from 'bluebird';
import exhibit from '..';
import {rmdirSyncRecursive, copyDirSyncRecursive} from 'wrench';
import {existsSync} from 'fs';
import fs from 'fs';
import path from 'path';

const tmpIn = path.join(__dirname, 'tmp-in');
const tmpOut = path.join(__dirname, 'tmp-out');


function reset(fixtureDir = 'MUST BE PROVIDED') {
  if (existsSync(tmpIn)) rmdirSyncRecursive(tmpIn);
  if (existsSync(tmpOut)) rmdirSyncRecursive(tmpOut);
  copyDirSyncRecursive(path.join(__dirname, fixtureDir), tmpIn);
}

export default async function exhibitTest() {
  reset('fixture-1');

  await exhibit(tmpIn)
    .step({
      '*.txt': (files) => {
        // console.log('PROCESSING', files);
        return files.map(file => {
          if (file.type === 'delete') return file;

          return {
            filename: file.filename,
            contents: file.contents + 'hiya!!!',
          };
        }).concat([{filename: 'hi.txt', contents: 'hmm'}]);
      },
    })
    .step(async (files) => {
      // this.emit('error', new Error('This is a fake, emitted error for testing'));
      // if (files[0].filename === 'foo/another.txt') {
      //   throw new Error('This is a thrown error for testing');
      // }

      return files;
    })
    .build(tmpOut, {watch: true}).then((changes) => {
      console.log('DONE! Files:', changes);

      setTimeout(() => {
        fs.writeFile(path.join(tmpIn, 'foo', 'bar.txt'), 'hm');
        fs.writeFile(path.join(tmpIn, 'foo', 'new.txt'), 'new');
        fs.writeFile(path.join(tmpIn, 'foo', 'what.txt'), 'what2');
      }, 500);

      setTimeout(() => {
        fs.writeFile(path.join(tmpIn, 'foo', 'another.txt'), 'another');
      }, 750);

      setTimeout(() => {
        console.log('deleting what.txt');
        fs.unlinkSync(path.join(tmpIn, 'what.txt'));
      }, 1000);

      setTimeout(() => {
        console.log('renaming foo/bar.txt');
        fs.renameSync(path.join(tmpIn, 'foo', 'bar.txt'), path.join(tmpIn, 'foo', 'bar2.txt'));
      }, 1500);
    });
}
