# Exhibit: Simple example

The enclosed [watch.js](./watch.js) file demonstrates some basic features of Exhibit – watch-driven building, the bundled server, and BrowserSync.

It creates a simple chain of two builders that both operate on JavaScript files – the first is the Babel plugin, and the second is an inline custom builder that adds a comment to any JavaScript files passing through. Other filetypes will just pass through each builder without being modified.

## Try it out

1. `cd` into this directory.
2. Run `npm install`.
3. Run `node watch.js`

The built-in web server should start automatically and open in your browser (because the `serve` and `open` options are enabled).

Now try editing the files in the `./app` directory – whenever you save a file, you should see the changes reflected in your browser instantly thanks to BrowserSync.
