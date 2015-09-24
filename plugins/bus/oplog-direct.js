var logger = require('../../lib/logger');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var Timestamp = Mongo.Timestamp;

var getStartTime = function(options, ts){
  if(ts){
    return ts;
  }
  if(!options || !options.startTime){
    var startFrom = new Date();
    startFrom.setSeconds(0);
    return Timestamp(0, Math.floor(startFrom.getTime() / 1000));
  }
  var startFrom = new Date(Date.parse(options.startTime));
  return Timestamp(0, Math.floor(startFrom.getTime() / 1000));
};

var getOplogConfig = function(options){
  var connectionString = options.connectionString;
  var database = options.database;

  var connParts = connectionString.split('?');
  var connStr = connParts[0].split('/');
  var db = connStr.pop();
  var ns = options.ns || (database || db)+'.'+options.collection||'bus';
  connStr.push(db);
  connStr = connStr.join('/')+(connParts[1]?'?'+connParts[1]:'');
  logger.info('BUS:', 'Connecting to:', connStr);
  return {
          connectionString: connStr,
          ns: ns,
        };
};

var Bus = function(options){
  this.options = options;
  this.logger = options.logger;
  this.monitoring = false;
  this.started = false;
  this.tailing = false;
  EventEmitter.call(this);
};

util.inherits(Bus, EventEmitter);

Bus.prototype.tail = function(){
  if(!this.started){
    return this.start();
  }
  if(this.tailing){
    return;
  }
  var {db, oplogConfig, options} = this;
  this.started = true;
  this.emit('started', oplogConfig);

  var cursorOptions = {
      tailable: true,
      awaitdata: true,
      //batchSize: 100,
      //maxTimeMS: 10000,//false,
      oplogReplay: true,
      cursorReplay: true,
      numberOfRetries: Number.MAX_VALUE
    };
  var collection = db.collection('oplog.rs');
  var filter = {
      //db: oplogConfig.db,
      ns: oplogConfig.ns,
      //ts: {$gte: oplogConfig.since},
      //coll: oplogConfig.coll,
      op: 'i'
    };
  var startTime = getStartTime(options, this.lastSeenTS);
  if(startTime){
    logger.info('BUS:', 'Start Timestamp: ', new Date(startTime.getHighBits()*1000));
    filter.ts = {$gt: startTime};
  }
  logger.info('BUS:', 'Filter: ', filter);

  var cursor = collection.find(filter, cursorOptions);

  //*
  // This doesn't seem to work the way we would like, instead of single records
  // when they arrive, it seems to push in bulk.
  var stream = this.tailStream = cursor.stream();
  stream.on('end', function(){
    logger.info('BUS:', 'Stopped');
    this.emit('stopped');
    this.tailing = false;
    this.started = false;
    this.starting = false;
  }.bind(this));
  stream.on('data', function(data){
    this.lastSeenTS = data.ts;
    this.emit('event', data);
    if(this.firstRecord){
      logger.info('BUS:', 'First record', new Date(this.lastSeenTS.getHighBits()*1000));
      this.firstRecord = false;
    }
  }.bind(this));
  stream.on('error', function(err){
    logger.error(err);
    var msg = err.message === 'n/a'?err.$err||err.toString():err.toString();
    if(/operation exceeded time limit/i.test(msg) ||
       /^server.+?sockets? closed$/i.test(msg)||
       /cursor (killed or )?timed out/i.test(msg)){
      logger.info('BUS:', 'Cursor died, restarting');
      return this.tail();
    }
    if(/connection.+?timed out/.test(msg)){
      logger.info('BUS:', 'Stopped');
      this.tailing = false;
      return this.emit('stopped');
    }
    this.emit('error', err);
  }.bind(this));
  stream.resume();
  //*/

  /*
  var next = function(){
    cursor.nextObject(function(err, data){
      if(err){
        var msg = err.message === 'n/a'?err.$err||err.toString():err.toString();
        logger.error(msg);
        if(/operation exceeded time limit/.test(msg) ||
           /cursor (killed or )?timed out/i.test(msg)){
          logger.info('Bus cursor died, restarting');
          return this.tail();
        }
        logger.error(err);
        return this.emit(err);
      }

      if(!data){
        return setImmediate(next);
      }

      if(this.firstRecord){
        logger.info('First record from bus: ', new Date(data.ts.getHighBits()*1000));
        this.firstRecord = false;
      }
      //oplogConfig.ts = data.ts;
      this.lastSeenTS = data.ts;
      this.emit('event', data);
      return setImmediate(next);
    }.bind(this));
  }.bind(this);
  next();
  //*/

  logger.info('BUS:', 'Awaiting Messages');
  this.tailing = true;
};

Bus.prototype.stop = function(){
  if(!this.started){
    return;
  }
  if(this.tailStream){
    this.tailStream.end();
    this.tailStream = null;
  }
  this.conn.close();
  this.db.close();
  this.started = false;
};

Bus.prototype.start = function(){
  var options = this.options;
  var oplogConfig = this.oplogConfig = getOplogConfig(options);

  if(this.started){
    return this.tail();
  }
  if(this.starting){
    return;
  }
  this.starting = true;

  MongoClient.connect(oplogConfig.connectionString, function(err, conn){
    this.starting = false;
    if(err){
      var msg = err.message === 'n/a'?err.$err||err.toString():err.toString();
      logger.error(err);
      if(/connection.+?timed out/.test(msg)){
        logger.info('BUS:', 'Stopped');
        this.emit('stopped');
      }
      return this.emit('error', err);
    }
    this.conn = conn;
    this.db = conn.db(oplogConfig.database || 'local');
    this.started = true;
    this.firstRecord = true;
    logger.info('BUS:', 'Connected to message bus');
    this.tail();
  }.bind(this));
};

module.exports = {
  Bus: Bus
};
