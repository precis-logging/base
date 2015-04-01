var memwatch = require('memwatch');
var heapdump = require('heapdump');

var fs = require('fs');
var path = require('path');

var DummyCollection = require('./lib/dummydb').Collection;
var reformFilter = require('./lib/dummydb').reformFilter;

var logger = require('./lib/logger');

var utils = require('./lib/utils');
var config = require('./lib/config');

var Oplog = require('mongo-oplog');
var Bus = require('./plugins/bus').Bus;

var store = require('./lib/store');
var webroot = path.join(__dirname, (config.web||{}).site||'/webroot');
var server = require('./lib/server');
var sift = require('sift');

var reIsFunction = /function\s*[]*\s\(([^)]+)\)*/;
var getFuncInfo = function(source){
  var args = /\(([^)]+)/.exec(source);
  var res = {};
  if (args[1]) {
    res.args = args[1];
  }
  res.body = source.replace(reIsFunction, '');
  return res;
};

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


var encode = function(source){
  var type = typeof(source);
  var encodeObject = function(obj){
    if(obj instanceof Date){
      return obj.toISOString();
    }
    if(obj instanceof RegExp){
      var src = obj.toString().split('/');
      return {
        $regex: src[1],
        $options: src[2]
      };
    }
    var res = {};
    Object.keys(obj).forEach(function(key){
      res[key] = encode(obj[key]);
    });
    return res;
  };
  var encodeArray = function(arr){
    return arr.map(function(item){
      return encode(item);
    });
  };
  switch(type){
    case('boolean'):
    case('string'):
    case('number'):
      return source;
      break;
    case('function'):
      return source.toString();
      break;
    default:
      if(!source){
        return source;
      }
      if(Array.isArray(source)){
        return encodeArray(source);
      }
      return encodeObject(source);
      break;
  }
};

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
  agg.push(data);
});

bus.on('stopped', function(){
  logger.info('Detached from message bus.');
});

bus.start();
