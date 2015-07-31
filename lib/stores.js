/*
Store Interface:
  asArray(options, callback)
    ->callback(err, recordsResponse)
  get(id, callback)
    ->callback(err, recordResponse)
  insert(record, callback)
    ->callback(err, recordResponse)
  ensure(record, callback)
    ->callback(err, recordResponse)
  update(id, record, callback)
    ->callback(err, recordResponse)
  upsert(key, record, callback)
    ->callback(err, recordResponse)
  delete(id, callback)
    ->callback(err, deletedBool)

  RecordsResponse = {
    root: 'key',
    'key': [Record],
    length: Number,
    count: Number,
    offset: Number
  }

  RecordResponse = {
    root: 'key',
    'key': {Object}
  }
*/

var npm = require('npm');
var config = require('./config').store || {};
var storeName = config.module;
var logger = require('./logger');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

if(!storeName){
  logger.error('No store module configured, please add a store member with a module define in your config.js file!');
  process.exit(1);
}

var Store = function(Base, config){
  this._Base = Base;
  this._provider = new Base(config);
};

var _providerDo = function(store, method, Store, args){
  if(!store._provider){
    return setImmediate(function(){
      return _providerDo(store, method, Store, args);
    }.bind(store));
  }
  return store._Base.prototype[method].apply(store._provider, args);
};

var wrap = function(source, method){
  source.prototype[method] = function(){
    _providerDo(this, method, source, arguments);
  };
};

wrap(Store, 'asArray');
wrap(Store, 'get');
wrap(Store, 'insert');
wrap(Store, 'ensure');
wrap(Store, 'update');
wrap(Store, 'upsert');
wrap(Store, 'delete');

var Stores = function(){
  EventEmitter.call(this);
};

util.inherits(Stores, EventEmitter);

Stores.prototype.init = function(base){
  var Store = base.Store || base;
  base.init(config);
  this._Store = Store;
  this.emit('ready', this);
};

var cache = {};
Stores.prototype.get = function(storeName, callback){
  if(!this._Store){
    return setImmediate(function(){
      this.get(storeName, callback);
    }.bind(this));
  }
  var store = cache[storeName];
  if(!store){
    store = cache[storeName] = new Store(this._Store, storeName);//new this._Store(storeName);
  }
  return store;
};

var stores = new Stores();

try{
  stores.init(require(storeName));
}catch(e){
  npm.load({
    loaded: false
  }, function(err){
    if(err){
      logger.error(err);
      process.exit(1);
    }

    npm.commands.install([storeName], function(err, data){
      if(err){
        logger.error(err);
        process.exit(1);
      }

      logger.info(storeName+' installed');
      stores.init(require(storeName));
    });

    npm.on('log', function(message){
      logger.info(message);
    });
  });
}

module.exports = stores;
