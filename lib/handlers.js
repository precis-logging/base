var npm = require('npm');
var config = require('./config').handlers;
var path = require('path');
var utils = require('precis-utils');
var defaults = utils.defaults;
var Wreck = require('wreck');
var url = require('url');
var logger = require('../lib/logger');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var async = require('async');

var loadModule = function(logger, moduleName, callback){
  try{
    var m = require(moduleName);
    return callback(null, m);
  }catch(e){
    if(!/cannot find module/i.test(e.toString())){
      logger.error(e);
      return callback(e);
    }
    logger.info('Installing:', moduleName);
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

        logger.info('Installed: ', moduleName);
        return callback(null, require(moduleName));
      });

      npm.on('error', function(err){
        logger.error(err);
      });

      npm.on('log', function(message){
        logger.debug(message);
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

  EventEmitter.call(this);

  setImmediate(function(){
    async.each(options.config||[], this.load.bind(this), function(err){
      if(err){
        return this.emit('error', err);
      }
      this._ready = true;
      this.emit('ready');
    }.bind(this));
  }.bind(this));
};

util.inherits(Handlers, EventEmitter);

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

Handlers.prototype.ready = function(callback){
  this.on('ready', callback);
  if(this._ready){
    return callback();
  }
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

var stats = {count: 0, lastCount: 0, counts: []};

setInterval(function(){
  if(stats.count&&logger.debug){
    logger.debug('pushed: ', stats.count-stats.lastCount, new Date(stats.latest.getHighBits()*1000));
  }
  stats.counts.push(stats.count-stats.lastCount);
  stats.counts = stats.counts.slice(Math.max(0, stats.counts.length-100), 100);
  stats.lastCount = stats.count;
}, 1000);

Handlers.prototype.load = function(options, next){
  var moduleOptions = defaults({
          logger: this.logger,
          stores: this.stores,
          server: this.server,
          bus: this.bus,
          ui: this.ui,
          sockets: this.sockets,
          register: this.register.bind(this),
        }, options.config);
  logger.debug('Loading:', options.location||options.module);
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
    this.handlers.push({
      module: location,
      handler: module,
    });
    logger.debug('Loaded:', options.location);
    return next();
  }
  if(options.module){
    return loadModule(this.logger, options.module, function(err, Module){
      if(err){
        return next(err);
      }
      try{
        var module = new Module(moduleOptions);
        this.handlers.push({
          module: options.module,
          handler: module,
        });
        logger.debug('Loaded:', options.module);
        return next();
      }catch(e){
        logger.error(e);
        return next(e);
      }
    }.bind(this));
  }
  throw new Error('Plugin location or module not set');
};

Handlers.prototype.push = function(doc){
  stats.count++;
  stats.latest = doc.ts;
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
