# `exhibit()`

**Creates an Exhibit instance.**

---

**Signature: exhibit(string: sourceDirectory)**

Returns a new Exhibit chain configured to read from the given `sourceDirectory`.

If `sourceDirectory` is relative, it will be relative to the CWD.

The returned 'chain' object has the methods [`.use()`](use.md) and [`.build()`](build.md).

No disk I/O or significant processing takes place until you call `.build()`.

## Reading from another Exhibit chain

It's also possible to read from another Exhibit as the source.

**Signature: exhibit(chain: source)**


```js
var firstChain = exhibit('./src')
  .use(...)
  .use(...)
  .use(...);


var secondChain(firstChain)
  .use(...)
  .use(...)
  .use(...);

secondChain.build('./dist');
```

The above snippet is essentially the same as if you had just done all six `.use()` calls in one go (starting with `exhibit('./src')`) and called `.build()`.

It might not be obvious why you'd want to do this, but check out the [gulp example](../../examples/3-with-gulp) to get an idea.
