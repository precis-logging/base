var Loader = require('../lib/loader');

var noop = function(){};

var Fetcher = function(options){
  this.options = options || {};
};

Fetcher.prototype.getBlock = function(opts){
  var options = opts || {};
  var api = options.api||this.options.api;
  var complete = options.callback||arguments[1]||noop;
  Loader.get(api, {
    uri: {
      offset: options.offset||0,
      limit: options.limit||1000
    }
  }, complete.bind(this));
};

Fetcher.prototype.getAll = function(opts){
  var options = opts || {};
  var records = [];
  var onProgress = options.progress||noop;
  var onError = options.error||noop;
  var onComplete = options.complete||arguments[1]||noop;

  var next = function(block){
    this.getBlock(block, function(err, data){
      if(err){
        return onError(err);
      }
      records = records.concat(data[data.root]||data.items||data);
      data.offset+=data.count;
      if(data.offset+data.count<data.length){
        onProgress(data.offset, data.count, data.length, ~~((data.offset+data.count)/data.length));
        return setTimeout(function(){
          next({offset:data.offset,limit:opts.limit});
        }, 0);
      }
      onComplete(records);
    });
  }.bind(this);

  next();
};

module.exports = {
  Fetcher: Fetcher
};