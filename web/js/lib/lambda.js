var stringType = typeof('');

var undefinedType = (function(undefined){
  return typeof(undefined);
})();

var numberType = typeof(1);

var compile = function(self, selfSymbol, expression){
  var type = typeof(expression);
  var identity = function(self){
    return self;
  };
  if(expression === null) return identity;
  if(type === undefinedType) return identity;
  if(type === stringType){
    if(expression === ""){
      return identity;
    }
    if(expression.indexOf("=>") === -1){
      var l = new Function(selfSymbol, "return " + expression);
      return function(){
        return l.apply(this, arguments);
      };
    }
    var expr = expression.match(/^[(\s]*([^()]*?)[)\s]*=>(.*)/);
    var l = new Function(expr[1], "return " + expr[2]);
    return function(){
      return l.apply(this, arguments);
    };
  }
};

var Lambda = function Lambda(expression){
  var self = this, type = typeof(expression);
  var options = expression||{};
  if(this.constructor !== Lambda){
    return compile(null,
        options.selfSymbol||Lambda.selfSymbol,
        options.expression||expression);
  }
  self.selfSymbol = options.selfSymbol||Lambda.selfSymbol;
  if(type==='string'){
    options = {
      expression: expression
    };
  }
  if(options.expression){
    self.compile(options.expression);
  }
};

Lambda.prototype.compile = function(expression){
  var self = this;
  self._f = compile(this, this.selfSymbol, expression);
  return self;
};

Lambda.prototype.execute = function(scope){
  var self = this;
  return self._f.apply(scope, arguments);
};

Lambda.selfSymbol = '$';

window.Lambda = Lambda;
