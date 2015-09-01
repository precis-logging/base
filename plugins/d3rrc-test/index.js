var fs = require('fs');
var path = require('path');

var routes = function(){
  var filename = this.filename;
  return [
    {
      method: 'GET',
      path: '/vendor/d3rrc/d3rrc.js',
      handler: function(req, reply){
        return reply.file(filename);
      }
    },
  ]
};

var registerUi = function(){
  return [
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
  ];
};

var Plugin = function(options){
  this.filename = path.resolve(__dirname, 'd3rrc.js');
};

// NOTE: This type of plugin doesn't require an init method
// since it doesn't actually do anything but surface a javascript
// library

Plugin.prototype.register = function(options){
  var register = options.register;
  register({
    proxy: options.proxy,
    ui: registerUi.call(this),
    server: routes.call(this)
  });
};

module.exports = Plugin;
