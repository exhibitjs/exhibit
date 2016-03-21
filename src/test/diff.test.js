import test from 'ava';
import diff from '../lib/diff';

test('diff() works', t => {
  const input = {
    foo: 'foo!',
    bar: 'bar!',
  };

  const output = {
    foo: 'foo!',
    baz: 'baz!',
  };

  const changes = diff(input, output)
    .map(contents => contents && contents.toString())
    .toJS();

  t.same(changes, {
    baz: 'baz!',
    bar: null,
  });
});
