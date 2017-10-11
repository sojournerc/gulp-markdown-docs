var gulpMarkdown = require('../');
var should = require('should');
var path = require('path');
var assert = require('stream-assert');
var File = require('gulp-util').File;
var gulp = require('gulp');
var fs = require('fs');
require('mocha');

var fixtures = function(glob) {
  return path.join(__dirname, 'fixtures', glob);
}
var expect = function (glob) {
  return path.join(__dirname, 'expect', glob);
}

describe('gulp-markdown-docs', function() {
  describe('gulpMarkdown()', function() {
    it('should throw, when arguments is missing', function() {
      (function() {
        gulpMarkdown();
      }).should.throw('Missing file argument for gulp-markdown-docs');
    });

    it('should ignore null files', function(done) {
      var stream = gulpMarkdown('index.html');
      stream
        .pipe(assert.length(0))
        .pipe(assert.end(done));
      stream.write(new File());
      stream.end();
    });

    it('should emit error on streamed file', function(done) {
      gulp.src(fixtures('*'), {
          buffer: false
        })
        .pipe(gulpMarkdown('index.html'))
        .on('error', function(err) {
          err.message.should.eql('Streaming not supported');
          done();
        });
    });

    it('should parse one file', function(done) {
      gulp.src(fixtures('file1-orphan.md'))
        .pipe(gulpMarkdown('file1.html'))
        .on('data', function (d) {
          d.contents.toString().should.eql(fs.readFileSync(expect('file1.html'), 'utf8'))
          done();
        });
    });

    it('should parse multiple files', function (done) {
      gulp.src(fixtures('*-orphan.md'))
        .pipe(gulpMarkdown('multiple.html'))
        .on('data', function (d) {
          d.contents.toString().should.eql(fs.readFileSync(expect('multiple.html'), 'utf8'))
          done();
        });
    })

    // TODO:
    // it('should sort category alphabetically', function (done) {
    // });

    // it('should sort categories by rank', function (done) {
    // });

    // it('should sort documents alphabetically', function (done) {
    // });

    // it('should sort documents by rank', function (done) {
    // });

    // it('should load external stylesheet', function (done) {
    // });

    // it('should use external template', function (done) {
    // });
  });
});
