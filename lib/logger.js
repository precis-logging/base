var cmdargs = require('./cmdargs')({'d': 'debug-messages'});
var noop = function(){};

var logger = {
  info: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString(), 'INFO:');
    console.log.apply(console, args);
  },
  warn: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString(), 'WARN:');
    console.log.apply(console, args);
  },
  error: function(e){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString(), 'ERROR:');
    console.error.apply(console, args);
    if(e.stack){
      console.error(e.stack);
    }
  },
  debug: (!cmdargs.debugMessages)?noop:function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString(), 'DEBUG:');
    console.log.apply(console, args);
  },
};

module.exports = logger;
