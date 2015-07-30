var noop = function(){};

var Test = function(options){
  this.logger = options.logger;
  this.msgPrefix = options.msgPrefix;
  this.store = options.stores.get('test');
  this.maxSize = options.maxSize || 10;
  this.records = [];
  options.server.route([
    {
      method: 'GET',
      path: '/api/v1/test/latest/record',
      handler: function(req, reply){
        return reply(this.latest);
      }.bind(this)
    },
    {
      method: 'GET',
      path: '/api/v1/test/records',
      handler: function(req, reply){
        return reply(this.records);
      }.bind(this)
    },
    {
      method: 'GET',
      path: '/api/v1/test/records/count',
      handler: function(req, reply){
        return reply(this.records.length);
      }.bind(this)
    },
  ])
};

Test.prototype.push = function(record){
  var logger = this.logger;
  this.latest = record;
  this.records.push(record);
  if(this.records.length===1){
    logger.info(this.msgPrefix || 'First Record Time: ', record.time);
  }
  if(this.records.length > this.maxSize){
    this.records = this.records.splice(this.records.length-this.maxSize, this.maxSize);
  }
};

module.exports = Test;
