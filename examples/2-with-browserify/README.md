# Demo with Exhibit and Browserify

The enclosed [watch.js](./watch.js) file shows how to bundle scripts with Browserify.

Builders used:

- [browserify](https://github.com/exhibitjs/exhibit-builder-browserify)
- [babel](https://github.com/exhibitjs/exhibit-builder-babel)
- [coffee](https://github.com/exhibitjs/exhibit-builder-coffee)

The use of Babel and CoffeeScript is to demonstrate the best way to preprocess things when using Exhibit. You don't need to use Browserify transforms – you can get much better performance by simply preprocessing your modules to JavaScript *before* bundling it with Browserify.

In this case the chain looks like this:

> babel => coffee => browserify => (output)

## Why in that order?

We know the output from CoffeeScript is already ES5, so there's no need to put that through Babel (it wouldn't hurt, but it's a waste). Hence we do Babel first, then CoffeeScript. (Builders generally just pass unrecognised filetypes straight through to the next step – so all `.coffee` files just go straight through the first builder unmodified.)

Once all the JavaScript has been preprocessed, it gets bundled with Browserify. In this case, we're telling Browserify that we only want it to bundle `main.js` as an entry, but you can also use globs or other techniques here – see the [options](https://github.com/exhibitjs/exhibit-builder-browserify).


## Try it out

1. `cd` into this directory.
2. Run `npm install`.
3. Run `node watch.js`

The built-in web server should start automatically and open in your browser (because the `serve` and `open` options are enabled).

Now try editing files in the `./app` directory – changes should be reflected in your browser immediately.
