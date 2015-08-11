var fs = require('fs');
var path = require('path');

var noop = function(){};

var Test = function(options){
  // Create a local copy of the configuration
  // options we are interested in
  this.logger = options.logger;
  this.msgPrefix = options.msgPrefix;
  this.maxSize = options.maxSize || 10;
  this.sockets = options.sockets;

  // Get a Store interface so we can load/save stuff
  this.store = options.stores.get('test');

  // We could use the store we got above
  // but for this simple example we will
  // just use an array
  this.records = [];

  // Setup some routes on the web server
  options.server.route([
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
  ]);

  options.ui.register([
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
          }
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
      }
    ]);
  // Yet more bad pracies, but for showing message emits its ok
  var counter=0;
  setInterval(function(){
    this.sockets.emit('test::counter', counter++);
  }.bind(this), 1000);
};

Test.prototype.push = function(record){
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
  //this.store.insert(record, noop);
};

module.exports = Test;
