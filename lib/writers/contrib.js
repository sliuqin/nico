/*
 * writers from outside
 *
 */


var fs = require('fs');
var path = require('path');
var util = require('util');
var logging = require('colorful').logging;
var BaseWriter = require('./base').BaseWriter;
var urilib = require('../utils/urilib');
var utils = require('../utils');


// this writer is contributed by Hsiaoming Yang <lepture@me.com>
// it is not a common writer, you don't have to config it in your `nico.json`
// you should write your post like this:
//
// # title
//
// - writer: nico.ApiWriter
// --------
// :section Collections: Collection Functions (Arrays or Objects)
//
// :item each: `_.each(list, iterator, [context])
// iterates over a list of elements .....
//
exports.ApiWriter = BaseWriter.extend({
  writerName: 'ApiWriter',

  run: function(post) {
    var lines = post.body.split('\n');
    var body = [], sidebar = [], inSection = false, match;
    lines.forEach(function(line) {
      // find section
      var section = /^:section\s+(.*?):/;
      match = line.match(section);
      if (match && match.length === 2) {
        var title = match[1];
        if (inSection) {
          inSection = false;
          sidebar.push('</ul>');
        }
        sidebar.push(
          util.format(
            '<a class="toc-title" href="#%s">%s</a>',
            urilib.encode(title), title)
        );
        line = line.replace(section, '');
        body.push(util.format('<h2 id="%s">%s</h2>', urilib.encode(title), line));
        return;
      }
      // find item
      var item = /^:item\s+(.*?):/;
      var alias = /:alias\s+(.*?):$/;
      match = line.match(item);
      if (match && match.length === 2) {
        var keyword = match[1];
        if (!inSection) {
          inSection = true;
          sidebar.push('<ul class="toc-section">');
        }
        sidebar.push(util.format('<li>- <a href="#%s">%s</a></li>', urilib.encode(keyword), keyword));
        // parse alias
        match = line.match(alias);
        if (match && match.length === 2) {
          line = line.replace(alias, util.format('<span class="alias">Alias: <strong>%s</strong></span>', match[1]));
        }
        line = line.replace(item, util.format('<strong id="%s" class="header">%s</strong>', urilib.encode(keyword), keyword));
        line = line.replace(/`(.*?)`/, '<code class="api">$1</code>');
        body.push(line + '<br />');
        return;
      }
      body.push(line);
    });
    post.body = body.join('\n');
    sidebar = sidebar.join('\n');
    var template = path.join(__dirname, '_templates', 'api-writer.html');
    this.render({
      destination: utils.destination(
        post, '{{directory}}/{{filename}}.html'),
      params: {post: post, sidebar: sidebar},
      template: post.template || template
    });
  }
});


/* this writer is contributed by Hsiaoming Yang <lepture@me.com>
 *
 * you will need ganam to active this writer:
 *
 * $ npm install ganam -g
 *
 * {
 *   "ganam": {
 *     "source": "./styleguide",
 *     "output": "styleguide",
 *     "options": {
 *       "paths": ["./nib"]
 *     }
 *   },
 *   "writers": [
 *     "ganam/lib/writer.GanamWriter"
 *   ]
 * }
 *
 */

var ganamExt = /\.(styl|css)$/;
exports.GanamWriter = BaseWriter.extend({
  writerName: 'GanamWriter',

  _styleguides: [],
  _template: path.join(__dirname, '_templates', 'ganam-writer.html'),

  setup: function() {
    var ganam = require('ganam');

    var ganamConfig = this.storage.config.ganam || {};
    this._template = ganamConfig.template || this._template;
    var output = ganamConfig.output || 'styleguide'

    var guides = [];
    fs.readdirSync(ganamConfig.source).forEach(function(file) {
      if (!file.match(ganamExt)) return;
      var guide = ganam.styleSync(
        path.join(ganamConfig.source, file), ganamConfig.options
      );
      if (guide && guide.sections.length) {
        guide.file = file;
        guide.name = file.replace(ganamExt, '');
        guide.destination = path.join(output, guide.name + '.html');
        guides.push(guide);
        logging.debug('Find style guide:', guide.name);
      } else {
        logging.warn('Not a valid style guide:', file);
      }
    });
    guides.sort(function(a, b) {
      return a.order - b.order;
    });
    this._styleguides = guides;
  },

  run: function() {
    var self = this;
    self._styleguides.forEach(function(guide) {
      self.render({
        destination: guide.destination,
        params: {
          styleguides: self._styleguides,
          guide: guide
        },
        template: self._template
      });
    });
  }
});
