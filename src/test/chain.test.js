import test from 'ava';
import chain from '../lib/chain';

test('chain() works', async t => {
  const builder = chain(
    files => files,
    async files => files.set('bar', 'bar'),
    null,
    files => files.set('bar', files.get('bar') + '!')
  );

  const result = await builder({ foo: 'foo!' });

  t.same(result.map(contents => contents.toString()).toJS(), {
    foo: 'foo!',
    bar: 'bar!',
  });
});
