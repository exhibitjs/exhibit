import {rmdirSyncRecursive, copyDirSyncRecursive} from 'wrench';
// import exhibitBrowserify from 'exhibit-browserify';
import exhibitCrawl from '../../../exhibit-crawl';
import exhibitCoffee from 'exhibit-coffee';
import {existsSync, writeFile} from 'fs';
import exhibitBabel from 'exhibit-babel';
import exhibitSass from 'exhibit-sass';
import exhibit from '../lib';
import path from 'path';

const testingDir = path.resolve(__dirname, '../../testing');
const tmpIn = path.join(testingDir, 'tmp-in');
const tmpOut = path.join(testingDir, 'tmp-out');


function reset(fixtureDir = 'MUST BE PROVIDED') {
  if (existsSync(tmpIn)) rmdirSyncRecursive(tmpIn);
  if (existsSync(tmpOut)) rmdirSyncRecursive(tmpOut);
  copyDirSyncRecursive(path.join(testingDir, fixtureDir), tmpIn);
}

export default async function exhibitTest() {
  reset('fixture-3');

  const app = exhibit(tmpIn, path.join(testingDir, 'bower_components'))
    .use(exhibitBabel())
    .use(exhibitCoffee())
    .use(exhibitSass())
    .use(exhibitCrawl())
    // .use(exhibitBrowserify())
  ;

  await app.build(tmpOut, {watch: true, verbose: true}).then(function (changes) {
    console.log('DONE FIRST TEST! Files:', changes);

    setTimeout(() => {
      writeFile(path.join(tmpIn, 'styles', 'stuff', '_var.scss'), '$blue: rgba(255,255,0,0.5); /* updated dynamically! */');
      writeFile(path.join(tmpIn, 'scripts', 'another.coffee'), 'alert "hi from another.coffee"');

      // setTimeout(() => {
      //   app.stop();
      // }, 500);
    }, 1000);
  });
}
