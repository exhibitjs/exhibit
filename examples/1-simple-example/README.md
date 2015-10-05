# Exhibit: Simple example

The [watch.js](./watch.js) file demonstrates some basic features of Exhibit – watch-driven building, the bundled server, and BrowserSync.

It creates a simple chain of two builders that both operate on JavaScript files – the first is the Babel plugin, and the second is an inline custom builder that adds a comment to any JavaScript files passing through. Other filetypes will just pass through each builder without being modified.

## Try it out

1. `cd` into this directory.
2. Run `npm install`.
3. Run `node watch.js`

The built-in web server should start thanks to the `serve: true` option, and it should open in your browser automatically thanks to `open: true`.

Now try editing files in the `app` directory. Whenever you save a file, you should see the changes reflected in your browser instantly. This is due to the `browserSync: true` option.
