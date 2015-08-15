var fs = require('fs');
var path = require('path');

var D3 = function(options){
  var server = options.server;
  var ui = options.ui;
  var filename = path.resolve(__dirname, 'd3.js');

  server.route([
    {
      method: 'GET',
      path: '/vendor/d3/d3.js',
      handler: function(req, reply){
        return reply.file(filename);
      }
    },
  ]);

  ui.register([
    {
      injectHeaders: [
        '<script src="/vendor/d3/d3.js" type="text/javascript"></script>',
      ]
    },
    {
      pages: [
        {
          route: '/d3',
          title: 'D3 Test Page',
          name: 'D3Page',
          filename: path.resolve(__dirname, 'page.jsx'),
        }
      ]
    },
    {
      components: [
        {
          name: 'd3Components',
          filename: path.resolve(__dirname, 'components.jsx'),
        },
      ],
    },
  ]);
};

module.exports = D3;
