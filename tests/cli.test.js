var path = require('path');
var require = require('./testutils');
var cli = require('../lib/cli');
var utils = require('../lib/utils');

var cliConfig = {
  swigConfig: {
    root: [path.join(__dirname, 'themes', 'theme1'), path.join(__dirname, 'themes', 'theme2')]
  },
  config: {
    permalink: 'cli/{{filename}}.html',
    output: path.join(__dirname, '_site')
  },
  resource: {}
};


describe('callReader', function() {
  it('should have public posts, secret posts and pages', function() {
    var storage = cli.callReader({
      config: {
        source: path.join(__dirname, 'data')
      }
    });
    var resource = storage.resource;
    resource.publicPosts.should.not.have.length(0);
    resource.secretPosts.should.not.have.length(0);
    resource.pages.should.not.have.length(0);
    resource.writerPosts.should.not.have.length(0);
  });
});

describe('config', function() {
  it('should config well', function() {
    cli.parseConfig(cliConfig);
  });
});
