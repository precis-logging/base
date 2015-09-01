var npm = require('npm');
var config = require('./config').handlers;
var path = require('path');
var utils = require('precis-utils');
var defaults = utils.defaults;
var Wreck = require('wreck');
var url = require('url');

var loadModule = function(logger, moduleName, callback){
  try{
    return callback(null, require(moduleName));
  }catch(e){
    npm.load({
      loaded: false
    }, function(err){
      if(err){
        logger.error(err);
        process.exit(1);
      }

      npm.commands.install([moduleName], function(err, data){
        if(err){
          logger.error(err);
          process.exit(1);
        }

        logger.info(moduleName+' installed');
        return callback(null, require(moduleName));
      });

      npm.on('log', function(message){
        logger.info(message);
      });
    });
  }
};

var Handlers = function(options){
  this.logger = options.logger;
  this.stores = options.stores;
  this.server = options.server;
  this.bus = options.bus;
  this.ui = options.ui;
  this.sockets = options.sockets;
  this.handlers = [];

  (options.config||[]).forEach(this.load.bind(this));
};

var handlerRedirect = function(route, serviceLocation){
  var method = route.method;
  var handler = function(req, reply){
    var uri = url.resolve(serviceLocation, req.url.path);
    var options = {
      headers: req.headers,
      payload: req.payload,
    };
    Wreck.request(method, uri, options, function(err, res){
      if(err){
        return reply(err);
      }
      return reply(res);
    });
  };
  if(typeof(route.config.handler)==='function'){
    route.config.handler = handler;
    return route;
  }
  route.handler = handler;
  return route;
};

Handlers.prototype.registerProxy = function(options){
  var ui = this.ui;
  var server = this.server;
  options.server = (options.server || []).map((route)=>handlerRedirect(route, options.proxy.host));
  server.route(options.server);
  ui.register(options.ui, options.proxy.host);
};

Handlers.prototype.register = function(options){
  var ui = this.ui;
  var server = this.server;
  if(options.proxy && options.proxy.host){
    return this.registerProxy(options);
  }
  server.route(options.server);
  ui.register(options.ui);
};

Handlers.prototype.load = function(options){
  var moduleOptions = defaults({
          logger: this.logger,
          stores: this.stores,
          server: this.server,
          bus: this.bus,
          ui: this.ui,
          sockets: this.sockets,
          register: this.register.bind(this),
        }, options.config);
  if(options.location){
    var location = path.resolve(__dirname, '..', options.location);
    var Module = require(location);
    var module = new Module(moduleOptions);
    if(module.init){
      module.init(moduleOptions);
    }
    if(module.register){
      module.register(moduleOptions);
    }
    return this.handlers.push({
      module: location,
      handler: module,
    });
  }
  if(options.module){
    return loadModule(this.logger, options.module, function(err, Module){
      var module = new Module(moduleOptions);
      return this.handlers.push({
        module: options.module,
        handler: module,
      });
    }.bind(this));
  }
};

Handlers.prototype.push = function(doc){
  this.handlers.forEach(function(details){
    try{
      if(details.handler.push){
        details.handler.push(doc.o, doc);
      }
    }catch(e){
      this.logger.error(details.module);
      this.logger.error(e);
    }
  }.bind(this));
};

module.exports = {
  Handlers: Handlers
};
