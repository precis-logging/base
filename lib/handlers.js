var npm = require('npm');
var config = require('./config').handlers;
var path = require('path');
var utils = require('./utils');
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

Handlers.prototype.load = function(options){
  var moduleOptions = defaults({
          logger: this.logger,
          stores: this.stores,
          server: this.server,
          bus: this.bus,
          ui: this.ui,
          sockets: this.sockets,
        }, options.config);
  if(options.location){
    var location = path.resolve(__dirname, '..', options.location);
    var Module = require(location);
    var module = new Module(moduleOptions);
    return this.handlers.push(module);
  }
  if(options.module){
    return loadModule(this.logger, options.module, function(err, Module){
      var module = new Module(moduleOptions);
      return this.handlers.push(module);
    }.bind(this));
  }
};

Handlers.prototype.push = function(record){
  this.handlers.forEach(function(handler){
    handler.push(record);
  });
};

module.exports = {
  Handlers: Handlers
};
