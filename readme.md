# [gulp](http://gulpjs.com)-markdown-docs
Parse markdown into an navigable HTML document with themed code syntax highlighting (via highlight.js), navigation menu (via yaml meta information), and flexible templating and styling.

## Install

```sh
$ npm install --save-dev gulp-markdown-docs
```


## Usage

```js
var gulp = require('gulp');
var markdownDocs = require('gulp-markdown-docs');

gulp.task('default', function () {
  return gulp.src('docs/*.md')
	.pipe(markdownDocs('index.html', {
    ... options ...
  }))
	.pipe(gulp.dest('./documentation/'));
});
```


### OPTIONS (defaults shown)

#### Meta Information

    yamlMeta: true

*Required* in order to construct the navigation menu. When set to true, each document given to gulp-markdown-docs should have a YAML header providing needed information about the document.

```markdown
---
label: Label for Nav
id: unique_slug

# Your Content
...
```

#### External Stylesheet

    stylesheetUrl: ''

Relative or absolute URL pointing to an external CSS resource. If defined will be added to the document in a link tag.

#### Layout Stylesheet

    layoutStylesheetUrl: __dirname + '/resources/layout.css'

gulp-markdown-docs includes a simple layout by default. `false` will prevent it from including that layout

#### Template HTML

    templatePath: __dirname + '/resources/index.html'

gulp-markdown-docs includes a simple HTML document by default. Passing a path to a different HTML file allows you to customize the resulting documentation page. This module looks for `<head>...</head>` to add stylesheets to, and `.doc-nav-list` and `doc-content` to append the navigation items and documentation articles to respectively. 

#### Highlight theme 
    
    highlightTheme: 'solarized_dark'

see [highlight.js](https://highlightjs.org/) for available themes
    

#### Markdown

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

Defaults shown. See documentation for [marked](https://www.npmjs.org/package/marked) for additional details. 


## License

MIT © [Christopher Meyer](https://github.com/sojournerc)
