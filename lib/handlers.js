var npm = require('npm');
var config = require('./config').handlers;
var path = require('path');
var utils = require('precis-utils');
var defaults = utils.defaults;

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

Handlers.prototype.register = function(options){
  var ui = this.ui;
  var server = this.server;
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
