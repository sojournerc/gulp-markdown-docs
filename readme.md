# [gulp](http://gulpjs.com)-markdown-docs [![Build Status](https://travis-ci.org/sojournerc/gulp-markdown-docs.svg?branch=master)](https://travis-ci.org/sojournerc/gulp-markdown-docs)

> Lorem ipsum


## Install

```sh
$ npm install --save-dev gulp-markdown-docs
```


## Usage

```js
var gulp = require('gulp');
var markdownDocs = require('gulp-markdown-docs');

gulp.task('default', function () {
	return gulp.src('src/file.ext')
		.pipe(markdownDocs())
		.pipe(gulp.dest('dist'));
});
```


## API

### markdownDocs(options)

#### options

##### foo

Type: `boolean`  
Default: `false`

Lorem ipsum.


## License

MIT © [Christopher Meyer](https://github.com/sojournerc)
