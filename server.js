try{
  var memwatch = require('memwatch');
  var heapdump = require('heapdump');
}catch(e){}

var fs = require('fs');
var path = require('path');

var logger = require('./lib/logger');

var utils = require('./lib/utils');
var config = require('./lib/config');
var handlersConfig = utils.defaults({handlers: []}, config).handlers;

var Oplog = require('mongo-oplog');
var Bus = require('./plugins/bus').Bus;

var stores = require('./lib/stores');
var webroot = path.join(__dirname, (config.web||{}).site||'/webroot');
var server = require('./lib/server');
var sift = require('sift');

var Handlers = require('./lib/handlers.js').Handlers;

var events = 0;

logger.info('Static content folder: '+webroot);
server.path(webroot);

try{
  fs.mkdirSync('./logs');
}catch(e){}

try{
  memwatch.on('leak', function(info) {
    logger.error(info);
    var file = './logs/' + process.pid + '-' + Date.now() + '.heapsnapshot';
    heapdump.writeSnapshot(file, function(err){
      if(err){
        logger.error(err);
      }else{
        logger.error('Wrote snapshot: ' + file);
      }
    });
  });
}catch(e){
  logger.warn('MemWatch not installed');
}

var bus = new Bus(config.bus);

var handlers = new Handlers({
  logger: logger,
  config: handlersConfig,
  server: server,
  stores: stores,
  bus: bus,
});

server.route([
    {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: webroot
        }
      }
    },
    {
      method: 'GET',
      path: '/api/v1/events/count',
      handler: function(req, reply){
        return reply(events);
      }
    },
  ]);

bus.on('started', function(info){
  logger.info('Attached to message bus.', info.ns?info.ns:info);
});

bus.on('event', function(data){
  handlers.push(data);
  events++;
});

bus.on('stopped', function(){
  logger.info('Detached from message bus.');
});

bus.start();
