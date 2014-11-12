var gutil = require('gulp-util');
var _ = require('lodash');
var through = require('through');
var path = require('path');
var cheerio = require('cheerio');
var marked = require('marked');
var yaml = require('js-yaml');
var PluginError = gutil.PluginError;
var fs = require('fs');
var File = gutil.File;
var highlight = require('highlight.js');

function gulpMarkdownDocs(fileOpt, opt) {
	if (!fileOpt) throw new PluginError('gulp-markdown-docs', 'Missing file argument for gulp-markdown-docs');
	if (!opt) opt = {};

	var DEFAULTS = {
		yamlMeta: true,
		stylesheetUrl: '',
		layoutStylesheetUrl: __dirname + '/lib/layout.css',
		templatePath: __dirname + '/lib/index.html',
		highlightTheme: 'googlecode', // see /node_modules/highlight.js/styles
		markdown: {
			highlight: function (code) {
		    return highlight.highlightAuto(code).value;
		  },
		  renderer: new marked.Renderer(),
		  gfm: true,
		  tables: true,
		  breaks: false,
		  pedantic: false,
		  sanitize: true,
		  smartLists: true,
		  smartypants: false
		}
	}

	// merge defaults and passed options 
	var options = _.extend({}, DEFAULTS, opt);
	var markdownOptions = options.markdown = _.extend({}, DEFAULTS.markdown, opt.markdown);

	// apply options for markdown parsing
	marked.setOptions(markdownOptions);
	
	// gather needed resources
	var docHtml = fs.readFileSync(options.templatePath);
	var highlightCss = fs.readFileSync(__dirname + '/node_modules/highlight.js/styles/'+options.highlightTheme+'.css');
	var layoutCss = options.layoutStylesheetUrl && fs.readFileSync(options.layoutStylesheetUrl);

	// place css resources
	var $ = cheerio.load(docHtml);
	var $head = $('head');
	if (options.stylesheetUrl) { 
		$head.append('<link rel="stylesheet" type="text/css" href="'+options.stylesheetUrl+'">'); 
	}
	$head.append('<style>'+highlightCss+'</style>');
	if (layoutCss) { $head.append('<style>'+layoutCss+'</style>'); }

	if (typeof fileOpt !== 'string') {
	  if (typeof fileOpt.path !== 'string') {
	    throw new PluginError('gulp-markdown-docs', 'Missing path in file options for gulp-markdown-docs');
	  }
	  fileOpt = path.basename(fileOpt.path);
	  // firstFile = new File(fileOpt);
	}

	function parseMarkdown(contents) {
		return marked(contents);
	}

	function appendToDoc(meta, html) {
		var anchor = '';
		if (yaml) {
			console.log(meta);
			anchor += '<a name="'+meta.id+'"></a>';
			$('.doc-nav-list').append(
				'<li class="doc-nav-item">'+
					'<a href="#'+meta.id+'">'+meta.label+'</a>'+
				'</li>'
			);
		}
		$('.doc-content').append(
			'<article class="doc-article">'+
				anchor+
				html+
			'</article>'
		);
	}

	var firstFile = null;
	function bufferContents(file) {
		var markdown, meta, html;
		if (!firstFile) firstFile = file;
		try {
			if (options.yamlMeta) {
				var split_text = file.contents.toString().split(/\n\n/);
				markdown = split_text.splice(1, split_text.length-1).join('\n\n');
				meta = yaml.safeLoad(split_text[0]);
				html = parseMarkdown(markdown);
			} else {
				html = parseMarkdown(file.contents.toString());
			}
			appendToDoc(meta, html);
		} catch (err) {
			gutil.log(gutil.colors.red('ERROR failed to parse api doc ' + file.path +'\n'), err);
		}
	}

	function endStream() {
		if (firstFile) {
			var joinedFile = firstFile;
			if (typeof fileOpt === 'string') {
				joinedFile = firstFile.clone({contents: false});
				joinedFile.path = path.join(firstFile.base, fileOpt)
			}
			joinedFile.contents = new Buffer($.html());
	  	this.emit('data', joinedFile);
  	}
  	this.emit('end');
	}

  return through(bufferContents, endStream);
};

module.exports = gulpMarkdownDocs;

