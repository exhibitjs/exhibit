# Using Exhibit with gulp

Exhibit is not related to gulp, and in fact it replaces a lot of the functionality that you'd normally use gulp plugins for.

But if you like gulp's command line interface, you might want to use Exhibit in a gulpfile.

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


## Example

Exhibit's [Web Starter Kit fork](https://github.com/exhibitjs/exhibit-wsk) has gulp tasks (`$ gulp`, `$ gulp serve`), and these tasks use Exhibit for all the actual building, making it significantly faster and lighter than Google's original.
