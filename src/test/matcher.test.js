import test from 'ava';
import matcher from '../lib/matcher';

test('matcher() works with a glob', t => {
  const match = matcher('foo/**/*.css');

  t.true(match('foo/a.css'));
  t.true(match('foo/a/b/c/d.css'));
  t.true(match('foo/a/b/c/.d.css'));
  t.false(match('a.css'));
  t.false(match('a/b/c/d.css'));
  t.false(match('a/b/c/d.html'));
});

test('matcher() works with an array of globs', t => {
  const match = matcher(['foo/**/*.css', '!**/*bar.*']);

  t.true(match('foo/a.css'));
  t.true(match('foo/a/.b.css'));

  t.true(match('foo/a/b/c/x.css'));
  t.false(match('foo/a/b/c/x-bar.css'));
});

test('matcher() treats null/undefined as matching everything', t => {
  let match = matcher(undefined);

  t.true(match('a.css'));
  t.true(match('foo/a.css'));
  t.true(match('foo/a/b/c/d.css'));

  match = matcher(null);

  t.true(match('a.css'));
  t.true(match('foo/a.css'));
  t.true(match('foo/a/b/c/d.css'));
});

test('matcher() works with functions, coercing the result to boolean', t => {
  const match = matcher(file => (file === 'foo' ? 1 : undefined));

  t.true(match('foo'));
  t.false(match('bar'));
});

test('matcher() works with regular expressions', t => {
  const match = matcher(/\.css$/);

  t.true(match('a.css'));
  t.false(match('a.html'));
});
