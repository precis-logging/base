'use strict';

//var semver = require('semver');
//var async = require('async');

var reIsDate=/mm-dd-yy/i;
var reIsBoolean=/(\d+|yes|no|true|false)/i;
var reIsTrue=/(yes|true|[1..9]\d*)/i;
var isNumeric = function(n){
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var expected = function(type, value){
  var got = typeof(value);
  if(got === 'object'){
    if(value instanceof Date){
      got = 'Date';
    }
    if(value instanceof Array){
      got = 'Array';
    }
    if(value === null){
      got = 'NULL';
    }
  }
  return 'Expected '+type+' got '+got;
};

var getNext = function(next){
  return (typeof(next)==='function'?next:next.proto);
};

var TYPES = {
  Default: function(defaultValue, next){
    return function(obj, callback){
      var type = typeof(obj);
      if(obj === null || type === 'undefined' || obj === ''){
        return callback(null, defaultValue);
      }
      if(next){
        return getNext(next)(obj, callback);
      }
      return callback(null, obj);
    };
  },
  ID: function(matchPattern, options){
    var rePattern = matchPattern?
      (matchPattern instanceof RegExp?matchPattern:new RegExp(matchPattern, options))
      :false;
    return function(obj, callback){
      process.nextTick(function(){
        var type = typeof(obj);
        if(type === 'string' || type === 'number'){
          if(type === 'string' && !obj.trim()){
            return callback('ID\'s can not be blank');
          }
          if(rePattern && !rePattern.exec(''+obj)){
            return callback('Must match '+rePattern);
          }
          return callback(null, obj);
        }
        return callback(expected('Identifier', obj));
      });
    };
  },
  String: function(minLength){
    var checkLength = (function(minLength){
      if(typeof(minLength)!=='undefined'&&isNumeric(minLength)){
        return function(s){
          return s.length>=minLength;
        }
      }
      return function(){
        return true;
      };
    })(minLength);
    return function(obj, callback){
      process.nextTick(function(){
        var type = typeof(obj);
        if(type==='string'){
          if(!checkLength(obj)){
            return callback('Must be at least '+minLength+' '+(minLength===1?'character':'characters')+' long');
          }
          return callback(null, obj);
        }
        if(type==='number'||type==='boolean'){
          return callback(null, ''+obj);
        }
        return callback(expected('String', obj));
      });
    };
  },
  RegExp: function(reSource, options){
    var re = reSource instanceof RegExp?reSource:new RegExp(reSource, options);
    return function(obj, callback){
      process.nextTick(function(){
        var type = typeof(obj);
        if(type==='number'||type==='boolean'){
          obj = ''+obj;
          type = 'string';
        }
        if(type!=='string'){
          return callback(expected('String', obj));
        }
        if(!re.exec(obj)){
          return callback('Must match '+reSource);
        }
        return callback(null, obj);
      });
    };
  },
  Number: function(){
    return function(obj, callback){
      process.nextTick(function(){
        if(isNumeric(obj)){
          return callback(null, +obj);
        }
        return callback(expected('Number', obj));
      });
    };
  },
  Object: function(proto, noAutoMigrate){
    var keys = Object.keys(proto||{});
    var validators = [];
    keys.forEach(function(key){
      var type = proto[key];
      if(typeof(type)!=='function'){
        throw new Error('Validator type not a function for key: '+key);
      }
      type.key = key;
      validators.push(type);
    });
    return function(obj, callback){
      if(typeof(obj)!=='object' || obj instanceof Date ||
         obj instanceof Array || obj === null || obj instanceof RegExp){
        return callback(expected('Object', obj));
      }
      var srcKeys = Object.keys(obj);
      var errors = [];

      if(!noAutoMigrate){
        srcKeys.forEach(function(key){
          if(keys.indexOf(key)===-1){
            obj.meta=obj.meta||{};
            obj.meta[key]=obj[key];
            delete obj[key];
          }
        });
      }

      async.eachLimit(validators, 10, function(validator, next){
        validator(obj[validator.key], function(err, value){
          if(err){
            if(err.errors){
              errors.push({key: validator.key, errors: err.errors});
              return next();
            }
            errors.push({key: validator.key, error: err});
            return next();
          }
          if(arguments.length>1){
            obj[validator.key] = value;
          }
          return next();
        });
      }, function(){
        if(errors.length>0){
          return callback({
            errors: errors
          });
        }
        return callback(null, obj);
      });
    };
  },
  Date: function(){
    return function(obj, callback){
      process.nextTick(function(){
        var type = typeof(obj);
        if(type==='object' && (obj instanceof Date)){
          return callback(null, obj);
        }
        if(type==='string'){
          var dt = Date.parse(obj);
          if(!!dt){
            return callback(null, new Date(dt));
          }
        }
        return callback(expected('Date', obj));
      });
    };
  },
  Nullable: function(next){
    return function(obj, callback){
      process.nextTick(function(){
        if(obj===null){
          return callback(null, obj);
        }
        if(next){
          return getNext(next)(obj, callback);
        }
        return callback(null, obj);
      });
    };
  },
  Optional: function(next){
    return function(obj, callback){
      process.nextTick(function(){
        if(typeof(obj)==='undefined'){
          return callback(null);
        }
        if(next){
          return getNext(next)(obj, callback);
        }
        return callback(null, obj);
      });
    };
  },
  Boolean: function(){
    return function(obj, callback){
      process.nextTick(function(){
        var type = typeof(obj);
        if(type==='boolean'){
          return callback(null, obj);
        }
        if(type==='number'){
          return callback(null, !!obj);
        }
        if(type==='string'){
          if(reIsBoolean.exec(obj)){
            return callback(null, !!reIsTrue.exec(obj));
          }
        }
        return callback(expected('Boolean', obj));
      });
    };
  },
  /*
  Semver: function(){
    return function(obj, callback){
      process.nextTick(function(){
        if(typeof(obj)!=='string'){
          return callback(expected('Semver String', obj));
        }
        if(semver.valid(obj)){
          return callback(null, obj);
        }
        return callback('Not a valid semver');
      });
    };
  },
  //*/
  Array: function(next){
    return function(obj, callback){
      process.nextTick(function(){
        var errors = [];
        if(typeof(obj)!=='object' || !(obj instanceof Array)){
          return callback(expected('Array', obj));
        }
        if(!next){
          return callback(null, obj);
        }
        async.eachLimit(obj, 10, function(child, nextChild){
          var idx = obj.indexOf(child);
          getNext(next)(child, function(err, value){
            if(err){
              if(err.errors){
                errors = errors.concat(err.errors);
                return nextChild();
              }
              errors.push({index: idx, error: err});
              return nextChild();
            }
            obj[idx] = value;
            return nextChild();
          });
        }, function(){
          if(errors.length){
            return callback({errors: errors});
          }
          return callback(null, obj);
        });
      });
    };
  },
  Value: function(value){
    return function(obj, callback){
      process.nextTick(function(){
        callback(null, value);
      });
    };
  },
};

var DEFAULTS = {
  _id: TYPES.Optional(TYPES.ID()),
  _created: TYPES.Optional(TYPES.Date()),
  _updated: TYPES.Optional(TYPES.Date()),
  _deleted: TYPES.Optional(TYPES.Nullable(TYPES.Date()))
};
var DEFAULT_KEYS = Object.keys(DEFAULTS);

var ORM = function(name, proto, noAutoMigrate){
  var self = this;
  self.name = name;
  if(typeof(name)!=='string'){
    noAutoMigrate = proto;
    proto = name;
    name = '';
  }
  if(typeof(proto)==='object'){
    DEFAULT_KEYS.forEach(function(key){
      proto[key]=proto[key]||DEFAULTS[key];
    });
  }
  self.proto = typeof(proto)==='function'?proto:TYPES.Object(proto, noAutoMigrate);
};

ORM.prototype.validate = function(pkt, callback){
  var self = this;
  self.proto(pkt, callback);
};

Object.keys(TYPES).forEach(function(key){
  ORM[key] = TYPES[key];
});

window.ORM = ORM;
