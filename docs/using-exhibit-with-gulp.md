# Using Exhibit with gulp

Exhibit is not related to gulp, but they work well together.

Exhibit doesn't have to be used with a task runner. But if you're already set up with gulp, you might want to try using Exhibit in your gulpfile.

The return value from Exhibit's `.build()` is a promise, and gulp loves promises:

```js
var gulp = require('gulp');
var exhibit = require('exhibit');

gulp.src('build', function () {
  return exhibit()
    .use('babel')
    .use('sass')
    .use('autoprefixer')
    .use('uglify')
    .build('app', 'dist');
})
```

> gulp will wait for the build promise to resolve (i.e. for all files to be written to the destination) before it deems the task 'complete'.


## Example

Exhibit's [Web Starter Kit fork](https://github.com/exhibitjs/exhibit-wsk) is a good example of using Exhibit in a gulpfile.
