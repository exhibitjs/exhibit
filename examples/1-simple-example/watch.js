var exhibit = require('exhibit');

var app = exhibit()
  .use('babel')
  .use(function addCopyright(job) {
    // add a comment if it's a JS file
    if (job.ext === '.js') {
      return '/* Copyright 2015 AwesomeCorp */\n' + job.contents;
    }

    // all other filetypes: just pass the contents through, unmodified
    return job.contents;
  });

app.build('app', 'dist', {
  watch: true,
  serve: true,
  open: true,
  browserSync: true
});
