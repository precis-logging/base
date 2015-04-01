var memwatch = require('memwatch');
var heapdump = require('heapdump');

var fs = require('fs');
var path = require('path');

var DummyCollection = require('./lib/dummydb').Collection;
var reformFilter = require('./lib/dummydb').reformFilter;

var logger = require('./lib/logger');

var utils = require('./lib/utils');
var config = require('./lib/config');
var handlerConfig = utils.defaults({}, config.handler);

var Oplog = require('mongo-oplog');
var Bus = require('./plugins/bus').Bus;

var store = require('./lib/store');
var webroot = path.join(__dirname, (config.web||{}).site||'/webroot');
var server = require('./lib/server');
var sift = require('sift');

var Handler = require('./lib/handler.js').Handler;

logger.info('Static content folder: '+webroot);
server.path(webroot);

try{
  fs.mkdirSync('./logs');
}catch(e){}

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

var handler = new Handler(handlerConfig);

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
  ]);

var bus = new Bus(config.bus);

bus.on('started', function(){
  logger.info('Attached to message bus.');
});

bus.on('event', function(data){
  handler.push(data);
});

bus.on('stopped', function(){
  logger.info('Detached from message bus.');
});

bus.start();
