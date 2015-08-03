var UI = function(options){
  var server = this.server = options.server;
  this.logger = options.logger;
  this.components = [];
  server.route([
    {
      method: 'GET',
      path: '/api/v1/ui/components',
      handler: function(req, reply){
        return reply(this.components);
      }.bind(this)
    }
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
    if(item.components){
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
  }.bind(this));
};

module.exports = UI;
