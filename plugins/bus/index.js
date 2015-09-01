var logger = require('../../lib/logger');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Oplog = require('mongo-oplog');

var getStartTime = function(options){
  if(!options || !options.startTime){
    var startFrom = new Date();
    startFrom.setSeconds(0);
    logger.info('Start: ', startFrom);
    return Math.floor(startFrom.getTime() / 1000);
  }
  var startFrom = new Date(Date.parse(options.startTime));
  logger.info('Start: ', startFrom);
  return Math.floor(startFrom.getTime() / 1000);
};

var Bus = function(options){
  this.options = options;
  this.monitoring = false;
  EventEmitter.call(this);
};

util.inherits(Bus, EventEmitter);

var getOplogConfig = function(options){
  var connectionString = options.connectionString;
  var database = options.database;

  var connParts = connectionString.split('?');
  var connStr = connParts[0].split('/');
  var db = connStr.pop();
  var ns = options.ns || (database || db)+'.'+options.collection||'bus';
  var since = getStartTime(options);
  var config = {
          since: since,
          ns: ns
        };
  logger.info('Start Timestamp: ', new Date(since*1000));
  connStr.push(db);
  connStr = connStr.join('/')+(connParts[1]?'?'+connParts[1]:'');
  logger.info('Bus connecting to:', connStr);
  return {
    connectionString: connStr,
    config: config
  };
};

Bus.prototype.start = function(){
  var options = this.options;
  var oplogConfig = getOplogConfig(options);
  var firstRecord = true;

  var opLog = Oplog(oplogConfig.connectionString,
          oplogConfig.config)
        .tail(function(err){
          this.monitoring = opLog;
          this.emit('started', err||opLog);
        }.bind(this));

  opLog.on('insert', function(doc){
    if(firstRecord){
      logger.info('First record from bus');
    }
    firstRecord = false;
    this.emit('event', doc);
  }.bind(this));
  opLog.on('error', function(err){
    this.emit('error', err);
  }.bind(this));
  opLog.on('end', function(){
    this.monitoring = false;
    this.emit('stopped');
  }.bind(this));
};

module.exports = {
  Bus: Bus
};
