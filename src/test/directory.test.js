import test from 'ava';
import directory from '../lib/directory';
import del from 'del';
import path from 'path';
import sander from 'sander';
import sinon from 'sinon';
import { delay } from 'bluebird';

// switch back down to project root (ava automatically runs this file in dist/test)
test.beforeEach(() => {
  process.chdir(path.resolve(__dirname, '..', '..'));
});


test.serial('watch()', async t => {
  const tmpBarPath = path.resolve(__dirname, '..', '..', 'tmp', 'bar');
  await del(tmpBarPath, { force: true });

  const foo = directory(__dirname, '..', '..', 'fixtures', 'foo');
  const bar = directory(tmpBarPath);

  await bar.write(await foo.read());

  const subscriber = sinon.spy();
  await bar.watch(subscriber);

  await delay(200);
  t.is(subscriber.callCount, 1);

  subscriber.reset();
  await sander.writeFile(tmpBarPath, 'will-this-fire.txt', 'hello');
  await delay(200);
  t.is(subscriber.callCount, 1);

  const result = subscriber.getCall(0).args[0];
  t.is(result.size, 3);

  t.true(foo.getCache().set('will-this-fire.txt', new Buffer('hello'))
    .equals(result));
});


test.serial('reading files from disk', async t => {
  const foo = directory(__dirname, '..', '..', 'fixtures', 'foo');

  const files = await foo.read();

  t.same(files.toJS(), {
    'file.txt': new Buffer('hello\n'),
    'bar/another.css': new Buffer('goodbye\n'),
  });
});

test.serial('filtering out files that don\'t match', async t => {
  const foo = directory(__dirname, '..', '..', 'fixtures', 'foo', {
    match: '**/*.css',
  });

  const files = await foo.read();

  t.same(files.toJS(), {
    'bar/another.css': new Buffer('goodbye\n'),
  });
});

test.serial('write() files to disk and read() them back', async t => {
  const tmpBarPath = path.resolve(__dirname, '..', '..', 'tmp', 'bar');
  await del(tmpBarPath, { force: true });

  const bar = directory(tmpBarPath);

  const writtenBar = await bar.write({
    'some-file.css': 'aside {background: squirple;}',
    'another/file.css': 'figure {color: glue}',
  });

  t.is(writtenBar.size, 2);
  t.is(writtenBar.get('some-file.css').toString(), 'aside {background: squirple;}');
  t.is(writtenBar.get('another/file.css').toString(), 'figure {color: glue}');

  // read back
  const bar2 = directory(tmpBarPath);

  const readBar = await bar2.read();

  t.true(writtenBar.equals(readBar));
});
