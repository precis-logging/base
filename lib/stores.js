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

var Store = function(storeName){
  EventEmitter.call(this);
};

util.inherits(Store, EventEmitter);

Store.prototype.init = function(base){
  var Store = base.Store || base;
  base.init(config);
  this._Store = Store;
};

var cache = {};
Store.prototype.get = function(storeName){
  var store = cache[storeName];
  if(!store){
    store = cache[storeName] = new this._Store(storeName);
  }
  return store;
};

var store = new Store();

try{
  store.init(require(storeName));
  setImmediate(function(){
    store.emit('ready', store);
  });
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
      store.init(require(storeName));
      store.emit('ready');
    });

    npm.on('log', function(message){
      logger.info(message);
    });
  });
}

module.exports = store;
