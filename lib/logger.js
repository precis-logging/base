var logger = {
  info: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString());
    console.log.apply(console, args);
  },
  warn: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString());
    console.log.apply(console, args);
  },
  error: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift((new Date()).toISOString());
    console.error.apply(console, args);
  }
};

module.exports = logger;
