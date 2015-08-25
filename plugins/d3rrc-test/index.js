var fs = require('fs');
var path = require('path');

var Charts = function(options){
  var server = options.server;
  var ui = options.ui;
  var filename = path.resolve(__dirname, 'd3rrc.js');

  server.route([
    {
      method: 'GET',
      path: '/vendor/d3rrc/d3rrc.js',
      handler: function(req, reply){
        return reply.file(filename);
      }
    },
  ]);

  console.log('Inject d3rrc')
  ui.register([
    {
      injectHeaders: [
        '<script src="/vendor/d3rrc/d3rrc.js" type="text/javascript"></script>',
      ]
    },
    {
      pages: [
        {
          route: '/d3rrc',
          title: 'D3RRC Test Page',
          name: 'D3RRCPage',
          filename: path.resolve(__dirname, 'page.jsx'),
        }
      ]
    },
    {
      components: [
        {
          name: 'd3rrcComponents',
          filename: path.resolve(__dirname, 'components.jsx'),
        },
      ],
    },
  ]);
};

module.exports = Charts;
