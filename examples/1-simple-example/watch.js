var exhibit = require('exhibit');

exhibit('app')

  .use('babel')

  .use(function addCopyright(path, contents) {
    // add a comment if it's a JS or CSS file
    if (path.endsWith('.js') || path.endsWith('.css')) {
      return '/* Copyright 2015 AwesomeCorp */\n' + contents;
    }

    // all other filetypes just pass straight through
    return contents;
  })

  .build('dist', {
    watch: true,
    serve: true,
    open: true,
    browserSync: true
  });
