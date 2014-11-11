'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var someModule = require('some-module');

module.exports = function (options) {
	if (!options.foo) {
		throw new gutil.PluginError('gulp-markdown-docs', '`foo` required');
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			cb();
			return;
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-markdown-docs', 'Streaming not supported'));
			cb();
			return;
		}

		try {
			file.contents = new Buffer(someModule(file.contents.toString(), options));
			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-markdown-docs', err));
		}

		cb();
	});
};
