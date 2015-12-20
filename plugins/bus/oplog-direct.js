var logger = require('../../lib/logger');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var Timestamp = Mongo.Timestamp;
var noop = function(){};

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
  logger.info(options.prefix||'BUS:', 'Connecting to:', connStr);
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
    logger.info(this.options.prefix||'BUS:', 'Start Timestamp: ', new Date(startTime.getHighBits()*1000));
    filter.ts = {$gt: startTime};
  }
  logger.info(this.options.prefix||'BUS:', 'Filter: ', filter);

  var cursor = collection.find(filter, cursorOptions);

  var stream = this.tailStream = cursor.stream();
  stream.on('end', function(){
    logger.info(this.options.prefix||'BUS:', 'Stopped');
    this.emit('stopped');
    this.tailing = false;
    this.started = false;
    this.starting = false;
  }.bind(this));
  stream.on('data', function(data){
    this.lastSeenTS = data.ts;
    this.emit('event', data);
    if(this.firstRecord){
      logger.info(this.options.prefix||'BUS:', 'First record', new Date(this.lastSeenTS.getHighBits()*1000));
      this.firstRecord = false;
    }
  }.bind(this));
  stream.on('error', function(err){
    logger.error(err);
    var msg = err.message === 'n/a'?err.$err||err.toString():err.toString();
    if(/operation exceeded time limit/i.test(msg) ||
       /^server.+?sockets? closed$/i.test(msg)||
       /cursor (killed or )?timed out/i.test(msg)){
      logger.info(this.options.prefix||'BUS:', 'Cursor died, restarting');
      return this.tail();
    }
    if(/connection.+?timed out/.test(msg)){
      logger.info(this.options.prefix||'BUS:', 'Stopped');
      this.tailing = false;
      this.started = false;
      this.starting = false;
      return this.emit('stopped');
    }
    this.emit('error', err);
  }.bind(this));
  stream.resume();

  logger.info(this.options.prefix||'BUS:', 'Awaiting Messages from '+oplogConfig.connectionString);
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
  var segments = this.oplogConfig.ns.split('.');
  var emitDb = segments[0];
  var emitCollName = this.emitCollName = segments[1];
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
        logger.info(this.options.prefix||'BUS:', 'Stopped');
        this.tailing = false;
        this.started = false;
        this.starting = false;
        this.emit('stopped');
      }
      return this.emit('error', err);
    }
    this.conn = conn;
    this.emitDb = conn.db(emitDb);
    this.db = conn.db(oplogConfig.database || 'local');
    this.started = true;
    this.firstRecord = true;
    logger.info(this.options.prefix||'BUS:', 'Connected to message bus '+oplogConfig.connectionString);
    this.tail();
  }.bind(this));
};

Bus.prototype.write = function(msg, callback){
  var reformIds = function(record){
    if(record._id){
      var id = record._id.toString?record._id.toString():record._id;
      try{
        id = new Mongo.ObjectID(id);
        record._id = id;
      }catch(e){}
    }
    return record;
  };
  var msgs = (Array.isArray(msg)?msg.map(reformIds):[msg].map(reformIds)).filter((record)=>!!record);
  if(msgs.length){
    return this.emitDb.collection(this.emitCollName).insertMany(msgs, {ordered: false}, callback||noop);
  }
  logger.debug('Empty Forward Recordset:', Array.isArray(msg)?msg.filter((record)=>!!record):msg);
};

module.exports = {
  Bus: Bus
};
