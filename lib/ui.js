var path = require('path');
var fs = require('fs');
var indexPageHandler = function(req, reply){
  fs.readFile(this.indexPageLocation, function(err, raw){
    var source = raw.toString();
    var page = source.replace('<!=pages=/>', this.pages.map(function(page){
      return `<script type="text/babel" src="${page.path}"></script>`;
    }).join('\n    ').trim());
    return reply(page);
  }.bind(this));
};

var UI = function(options){
  var {
      server,
      webroot,
      bowerRoot,
    } = options;
  this.server = server;
  this.logger = options.logger;
  this.components = [];
  this.pages = [];
  this.indexPageLocation = path.join(options.webroot, 'index.html');
  console.log(options);
  server.route([
    {
      method: 'GET',
      path: '/api/v1/ui/components',
      handler: function(req, reply){
        return reply(this.components);
      }.bind(this)
    },
    {
      method: 'GET',
      path: '/api/v1/ui/pages',
      handler: function(req, reply){
        return reply(this.pages);
      }.bind(this)
    },
    {
      method: 'GET',
      path: '/index.html',
      handler: indexPageHandler.bind(this)
    },
    {
      method: 'GET',
      path: '/',
      handler: indexPageHandler.bind(this)
    },
    {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: webroot
        }
      }
    },
    {
      method: 'GET',
      path: '/vendor/{param*}',
      handler: {
        directory: {
          path: bowerRoot
        }
      }
    },
    {
      method: 'GET',
      path: '/vendor/babel/{param*}',
      handler: {
        directory: {
          path: path.join(__dirname, '../node_modules/babel-core/')
        }
      }
    },
  ]);
};

UI.prototype.register = function(options){
  var items = Array.isArray(options)?options:[options];
  items.forEach(function(item){
    if(item.path && item.contents){
      return this.server.route({
        path: item.path,
        method: item.method || 'GET',
        handler: function(req, reply){
          return reply(item.contents);
        }
      });
    }
    if(item.path && item.filename){
      return this.server.route({
        path: item.path,
        method: item.method || 'GET',
        handler: function(req, reply){
          return reply.file(item.filename);
        }
      });
    }
    if(item.components && Array.isArray(item.components)){
      var routes = item.components.map(function(base){
        var componentPath = '/components/'+base.name;
        this.components.push(componentPath);
        return {
          method: 'GET',
          path: componentPath,
          handler: function(req, reply){
            return reply.file(base.filename);
          }
        };
      }.bind(this));
      return this.server.route(routes);
    }
    if(item.pages && Array.isArray(item.pages)){
      var pages = item.pages.map(function(info){
        var pagePath = info.route;
        this.pages.push({
          title: info.title,
          section: info.section,
          componentName: info.name,
          path: pagePath
        });
        return {
          method: 'GET',
          path: pagePath,
          handler: function(req, reply){
            return reply.file(info.filename);
          }
        };
      }.bind(this));
      return this.server.route(pages);
    }
  }.bind(this));
};

module.exports = UI;
