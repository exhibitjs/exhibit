var exhibit = require('exhibit');

exhibit('app')
  .use('babel')
  .use('coffee')
  .use('browserify', 'main.js')
  .build('dist', true);
