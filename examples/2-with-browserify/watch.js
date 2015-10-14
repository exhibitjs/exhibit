var exhibit = require('exhibit');

exhibit()
  .use('babel')
  .use('coffee')
  .use('browserify', 'main.js')
  .build('app', 'dist', {
    watch: true,
    serve: true,
    browserSync: true,
    open: true
  });
