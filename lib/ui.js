var UI = function(options){
  this.logger = options.logger;
  this.server = options.server;
};

UI.prototype.register = function(options){
  var items = Array.isArray(options)?options:[options];
  items.forEach(function(item){
    if(item.path && item.contents){
      this.server.route({
        path: item.path,
        method: item.method || 'GET',
        handler: function(req, reply){
          return reply(item.contents);
        }
      });
    }
    if(item.path && item.filename){
      this.server.route({
        path: item.path,
        method: item.method || 'GET',
        handler: function(req, reply){
          return reply.file(item.filename);
        }
      });
    }
  }.bind(this));
};

module.exports = UI;
