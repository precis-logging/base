(function(container){
  container.socket = io();
  var old = container.socket.on;
  container.socket.on = function(eventName, handler){
    var newHandler = function(event, data){
      //console.log(eventName);
      handler.apply(this, arguments);
    };
    old.call(this, eventName, newHandler);
  };
})(this);
