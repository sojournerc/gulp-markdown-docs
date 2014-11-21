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
		categorySort: 'alphabetical', // 'alphabetical' || 'rank' 
		documentSort: 'alphabetical', // 'alphabetical' || 'rank'
		layoutStylesheetUrl: __dirname + '/resources/layout.css',
		templatePath: __dirname + '/resources/index.html',
		highlightTheme: 'solarized_dark', // see /node_modules/highlight.js/styles
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
	var _ORPHAN_SLUG = 'orphans';
	
	// merge defaults and passed options 
	var options = _.extend({}, DEFAULTS, opt);
	var markdownOptions = options.markdown = _.extend({}, DEFAULTS.markdown, opt.markdown);

	// apply options for markdown parsing
	marked.setOptions(markdownOptions);
	
	// gather needed resources
	var indexHtml = fs.readFileSync(options.templatePath);
	var highlightCss = fs.readFileSync(__dirname + '/node_modules/highlight.js/styles/'+options.highlightTheme+'.css');
	var layoutCss = options.layoutStylesheetUrl && fs.readFileSync(options.layoutStylesheetUrl);

	// place css resources
	var $ = cheerio.load(indexHtml);
	var $head = $('head');
	$head.append('<style>'+highlightCss+'</style>');
	if (layoutCss) { $head.append('<style>'+layoutCss+'</style>'); }
	// add the custom style sheet last for sensible overrides
	if (options.stylesheetUrl) { 
		$head.append('<link rel="stylesheet" type="text/css" href="'+options.stylesheetUrl+'">'); 
	}

	if (typeof fileOpt !== 'string') {
	  if (typeof fileOpt.path !== 'string') {
	    throw new PluginError('gulp-markdown-docs', 'Missing path in file options for gulp-markdown-docs');
	  }
	  fileOpt = path.basename(fileOpt.path);
	  firstFile = new File(fileOpt);
	}

	function parseMarkdown(contents) {
		return marked(contents);
	}

	function appendToIndex(categories) {
		// add categories and their docs to $
		var $nav = $('.doc-nav');
		var $content = $('.doc-content');
		categories.forEach(function (category) {
			var $section = $('<section class="doc-section"></section>');
      var $navGroup = $('<ul class="doc-nav-group"></ul>');
			if (category.categoryLabel && category.categorySlug !== _ORPHAN_SLUG) { 
				$navGroup.append('<li class="doc-nav-group-header"><a href="#'+category.categorySlug+'">'+category.categoryLabel+'</a></li>');
				$section.append('<h1 class="doc-section-header"><a class="doc-nav-anchor" name="'+category.categorySlug+'"></a>'+category.categoryLabel+'</h1>'); 
			}
			category.children.forEach(function (doc) {
				var anchor = '';
				if (doc.meta) {
					anchor += '<a class="doc-nav-anchor" name="'+doc.meta.id+'"></a>';
					$navGroup.append(
						'<li class="doc-nav-item">'+
							'<a href="#'+doc.meta.id+'">'+doc.meta.label+'</a>'+
						'</li>'
					);
				}
				$section.append(
					'<article class="doc-article">'+
						anchor+
						doc.html+
					'</article>'
				);
			});
      $nav.append($navGroup);
      $content.append($section);
		});
	}

	var collectedDocs = [];
	function sortDocs(docs) {
		// first group the docs according to category
		var categories = {};
		docs.forEach(function (doc, i) {
			if (doc.meta && doc.meta.categorySlug) {
				var slug = doc.meta.categorySlug;
				categories[slug] = categories[slug] || { children: [] };
				categories[slug].children.push(doc);
				categories[slug].categoryLabel = (!!doc.meta.categoryLabel) ? doc.meta.categoryLabel : categories[slug].categoryLabel;
				categories[slug].categoryRank = (!!doc.meta.categoryRank) ? doc.meta.categoryRank : categories[slug].categoryRank;
			} else {
				categories[_ORPHAN_SLUG] = categories[_ORPHAN_SLUG] || { children: [] };
				categories[_ORPHAN_SLUG].children.push(doc); 
				// orphans go to the back
				categories[_ORPHAN_SLUG].categoryRank = 1000000;
				categories[_ORPHAN_SLUG].categoryLabel = 'zzzzzzz';
			}
		});
		// map categories into an array
		categories = _.map(categories, function (category, key) {
			return { categoryLabel: category.categoryLabel, children: category.children, categoryRank: category.categoryRank, categorySlug: key }
		});
		// sort categories
		categories = _.sortBy(categories, (options.categorySort === 'rank' ? 'categoryRank' : 'categoryLabel'));
		// sort docs
		categories.forEach(function (category) {
			category.children = _.sortBy(category.children, (options.documentSort === 'rank' ? 'documentRank' : 'documentLabel'));
		});
		return categories;
	}

	var firstFile = null;
	function bufferContents(file) {
		if (file.isNull()) return; // ignore
    if (file.isStream()) return this.emit('error', new PluginError('gulp-markdown-docs',  'Streaming not supported'));

		var markdown, meta, html;
		if (!firstFile) firstFile = file;
		try {
			if (options.yamlMeta) {
				var split_text = file.contents.toString().split(/\n\n/);
				markdown = split_text.splice(1, split_text.length-1).join('\n\n');
				collectedDocs.push({
					meta:yaml.safeLoad(split_text[0]),
					html:parseMarkdown(markdown)
				});
			} else {
				collectedDocs.push({
					html: parseMarkdown(file.contents.toString())
				});
			}
		} catch (err) {
			gutil.log(gutil.colors.red('ERROR failed to parse api doc ' + file.path +'\n'), err);
		}
	}

	function endStream() {
		if (firstFile) {
			var joinedFile = firstFile;
			var sortedDocs = sortDocs(collectedDocs);
			
			appendToIndex(sortedDocs);
			
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

