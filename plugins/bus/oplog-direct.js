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
  logger.info('Bus connecting to:', connStr);
  return {
          connectionString: connStr,
          ns: ns,
        };
};

var Bus = function(options){
  this.options = options;
  this.logger = options.logger;
  this.monitoring = false;
  this.firstRecord = true;
  this.started = false;
  EventEmitter.call(this);
  this.firstRecord = true;
};

util.inherits(Bus, EventEmitter);

Bus.prototype.tail = function(){
  var {db, oplogConfig, options} = this;
  this.started = true;

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
    logger.info('Start Timestamp: ', new Date(startTime.getHighBits()*1000));
    filter.ts = {$gt: startTime};
  }
  logger.info('Bus Filter: ', filter);

  var cursor = collection.find(filter, cursorOptions);

  //*
  // This doesn't seem to work the way we would like, instead of single records
  // when they arrive, it seems to push in bulk.
  var stream = cursor.stream();
  stream.on('end', function(){
    logger.info('Bus stopped');
    this.emit('stopped');
  }.bind(this));
  stream.on('data', function(data){
    this.firstRecord = false;
    this.lastSeenTS = data.ts;
    this.emit('event', data);
    if(this.firstRecord){
      logger.info('First record from bus', new Date(this.lastSeenTS.getHighBits()*1000));
    }
  }.bind(this));
  stream.on('error', function(err){
    logger.error(err);
    var msg = err.message === 'n/a'?err.$err||err.toString():err.toString();
    if(/operation exceeded time limit/i.test(msg) ||
       /^server.+?sockets? closed$/i.test(msg)||
       /cursor (killed or )?timed out/i.test(msg)){
      logger.info('Cursor died, restarting');
      return this.tail();
    }
    if(/connection.+?timed out/.test(msg)){
      logger.info('Bus stopped');
      return this.emit('stopped');
    }
    this.emit('error', err);
  }.bind(this));

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
      }
      //oplogConfig.ts = data.ts;
      this.lastSeenTS = data.ts;
      this.firstRecord = false;
      this.emit('event', data);
      return setImmediate(next);
    }.bind(this));
  }.bind(this);
  next();
  //*/
};

Bus.prototype.start = function(){
  var options = this.options;
  var oplogConfig = this.oplogConfig = getOplogConfig(options);

  MongoClient.connect(oplogConfig.connectionString, function(err, conn){
    if(err){
      logger.error(err);
      if(/connection.+?timed out/.test(msg)){
        logger.info('Bus stopped');
        this.emit('stopped');
      }
      return this.emit('error', err);
    }
    this.db = conn.db(oplogConfig.database || 'local');
    this.tail();
    logger.info('Connected to message bus, awaiting messages');
  }.bind(this));
};

module.exports = {
  Bus: Bus
};
