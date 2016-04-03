import test from 'ava';
import matcher from '../lib/matcher';

test('matcher() works with glob strings', t => {
  const match = matcher('foo/**/*.css');

  t.true(match('foo/a.css'));
  t.true(match('foo/a/b/c/d.css'));
  t.true(match('foo/a/b/c/.d.css'));
  t.false(match('a.css'));
  t.false(match('a/b/c/d.css'));
  t.false(match('a/b/c/d.html'));
});

test('matcher() works with functions', t => {
  const match = matcher(file => file === 'foo');

  t.true(match('foo'));
  t.false(match('bar'));
});

test('matcher() works with regular expressions', t => {
  const match = matcher(/\.css$/);

  t.true(match('a.css'));
  t.false(match('a.html'));
});
