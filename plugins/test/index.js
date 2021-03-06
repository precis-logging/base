var fs = require('fs');
var path = require('path');
var defaults = require('precis-utils').defaults;

var noop = ()=>{};

var routes = function(){
  return [
    {
      method: 'GET',
      path: '/api/v1/test/latest/record',
      config: {
        description: 'Get latest record seen',
        notes: 'These are the notes related to /api/v1/test/latest/record for SWAGGER documentation',
        tags: ['api'],
        handler: function(req, reply){
          return reply(this.latest);
        }.bind(this)
      }
    },
    {
      method: 'GET',
      path: '/api/v1/test/records',
      config: {
        description: 'Get the last '+this.maxSize+' records seen',
        tags: ['api'],
        handler: function(req, reply){
          // If you wanted to use the store you
          // would do it as follows
          /*
          return store.asArray(req.query, function(err, records){
            return reply(err || records);
          });
          */
          return reply(this.records);
        }.bind(this)
      }
    },
    {
      // Of course, if we used the store this
      // would all have to change to support
      // getting the number of records
      // from the store
      method: 'GET',
      path: '/api/v1/test/records/count',
      config: {
        description: 'Get the number of records seen',
        tags: ['api'],
        handler: function(req, reply){
          return reply(this.records.length);
        }.bind(this)
      }
    },
    {
      // Of course, if we used the store this
      // would all have to change to support
      // getting the number of records
      // from the store
      method: 'GET',
      path: '/api/v1/test/counter',
      config: {
        description: 'Get the internal counter',
        tags: ['api'],
        handler: function(req, reply){
          return reply(this.counters[this.counters.length?this.counters.length-1:0]||-1);
        }.bind(this)
      }
    },
    {
      // Of course, if we used the store this
      // would all have to change to support
      // getting the number of records
      // from the store
      method: 'GET',
      path: '/api/v1/test/counters',
      config: {
        description: 'Get the last '+this.maxSize+' counters',
        tags: ['api'],
        handler: function(req, reply){
          return reply(this.counters);
        }.bind(this)
      }
    },
  ];
};

var registerUi = function(){
  return [
    // Register a test page
    {
      path: '/test.html',
      filename: path.resolve(__dirname, 'test.html'),
    },
    // Register some test components
    {
      components: [
        {
          name: 'testComponents',
          filename: path.resolve(__dirname, 'components.jsx'),
        },
      ],
    },
    // Register some page routes with navigation
    {
      pages: [
        {
          route: '/test',
          title: 'Test Page from Plugin',
          name: 'Test',
          filename: path.resolve(__dirname, 'page.jsx'),
        }
      ]
    },
    // Register a Reflux datastore that picks up data
    // from socket.io
    {
      stores: [
        // It would actually be more useful to define a
        // DataStore around test::record, but this gives
        // us an easy to show off consistent source
        {
          name: 'TestStore',
          filter: {event: 'test-timer'},
          socketEvent: {
            event: 'test::counter',
            prefetch: '/api/v1/test/counters',
            reform: {
              event: '"test-timer"',
              counter: '$'
            }
          }
        }
      ]
    }
  ];
};

var Plugin = function(options){
  // Create a local copy of the configuration
  // options we are interested in
  this.logger = options.logger;
  this.msgPrefix = options.msgPrefix;
  this.maxSize = options.maxSize || 10;
  this.sockets = options.sockets;


  // We could use the store we got above
  // but for this simple example we will
  // just use an array
  this.records = [];
  this.counters = [];
};

Plugin.prototype.push = function(record){
  // Of course, if we used the store this
  // would all have to change to support
  // the record count limit
  var logger = this.logger;
  this.latest = record;
  this.records.push(record);
  if(this.records.length===1){
    logger.info(this.msgPrefix || 'First Record Time: ', record.time);
  }
  if(this.records.length > this.maxSize){
    this.records = this.records.splice(this.records.length-this.maxSize, this.maxSize);
  }
  this.sockets.emit('test::record', record);
};

Plugin.prototype.init = function(options){
  var logger = options.logger;
  var sockets = this.sockets = options.sockets;
  // Get a Store interface so we can load/save stuff
  this.store = options.stores.get('test');
  var config = this.config = defaults({}, options);
  // Yet more bad pracies, but for showing message emits its ok
  var counter=0;
  setInterval(function(){
    this.sockets.emit('test::counter', counter++);
    this.counters.push(counter);
    if(this.counters.length > this.maxSize){
      this.counters = this.counters.splice(this.counters.length-this.maxSize, this.maxSize);
    }
  }.bind(this), 1000);
};

Plugin.prototype.register = function(options){
  var register = options.register;
  register({
    proxy: options.proxy,
    ui: registerUi.call(this),
    server: routes.call(this)
  });
};


module.exports = Plugin;
