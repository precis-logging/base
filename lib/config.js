var logger = require('./logger');
var configLocations = ['../config/config.js', '../config/config.json', '../config/index.js', '../config.js', '../config.json'];
var envLocations = ['../config/.env', '../.env'];
var fs = require('fs');
var path = require('path');

var cfgidx = process.argv.indexOf('--configfile');
if(cfgidx > -1){
  configLocations = [process.argv[cfgidx+1]].concat(configLocations);
}

var configFileName = (function(){
  var files = configLocations.filter(function(fn){
    var fl = path.join(__dirname, fn);
    return fs.existsSync(fl);
  });
  return files.shift();
})();
var envFileName = (function(){
  var files = envLocations.filter(function(fn){
    var fl = path.join(__dirname, fn);
    return fs.existsSync(fl);
  });
  return files.shift();
})();

if(!configFileName){
  logger.error('You must have a config.js file in either the project root or the config folder.');
  process.exit(1);
}
logger.info('Loading configuration from:', configFileName);
var configFile = require(configFileName);
var fs = require('fs');
var extend = require('precis-utils').extend;

if(envFileName){
  var lines = fs.readFileSync(path.join(__dirname, envFileName)).toString().split(/(\r\n|\n\r|\n|\r)/);
  logger.info('Loading environment settings from: ', envFileName);
  lines.forEach(function(line){
    if(line && !/^\s*\#/i.test(line)){
      var parts = line.split('='),
        key = parts.shift(),
        value = parts.join('=');
      if(key && key.trim()){
        process.env[key]=value;
      }
    }
  });
}

var linkEnvValues = function(obj){
  var res = {};
  if(typeof(obj)!=='object'){
    return obj;
  }
  if(obj instanceof Array){
    var arr = [];
    obj.forEach(function(entry){
      arr.push(linkEnvValues(entry));
    });
    return arr;
  }
  if(typeof(obj.$env)==='string'){
    return process.env[obj.$env]||obj.$def;
  }
  var keys = Object.keys(obj);
  keys.forEach(function(key){
    res[key] = linkEnvValues(obj[key]);
  });
  return res;
};

var valueFromObject = function(obj, key, def){
  var o = obj;
  var path = key.split('.');
  var segment;
  while(o && path.length){
    segment = path.shift();
    o = o[segment];
  }
  if(typeof(o) !== 'undefined'){
    return o;
  }
  return def;
};

var applyLinks = function(node, source){
  if(!node){
    return node;
  }
  if(Array.isArray(node)){
    return node.map((item)=>applyLinks(item, source));
  }
  switch(typeof(node)){
    case('string'):
    case('number'):
    case('boolean'):
      return node;
  }
  return Object.keys(node).reduce((cfg, key)=>{
    var value = node[key];
    if(value && value.$link){
      cfg[key] = valueFromObject(source, value.$link);
      return cfg;
    }
    cfg[key] = applyLinks(value, source);
    return cfg;
  }, {});
};

var commandLineArgs = (function(){
  var name, val, tmp, names, values={}, i;
  var reCmdLineStrip=/^(\-|\\|\/)*/i;
  for(i = 2; i < process.argv.length; i++){
    tmp = process.argv[i].replace(reCmdLineStrip, '').split('=');
    name = tmp.shift();
    if(tmp.length>0){
      val = tmp.join('=');
    }else{
      val = true;
    }
    tmp = values;
    names = name.split('.');
    while(names.length>1){
      name = names.shift();
      tmp = tmp[name]=tmp[name]||{};
    }
    tmp[names.shift()]=val;
  }
  return values;
})();

var env = commandLineArgs.env || commandLineArgs.mode || process.env.NODE_ENV;
var envLookup = configFile.alias||{
  prd: 'production',
  dev: 'development',
  stg: 'stage',
  rel: 'release'
};
delete commandLineArgs.env;
delete commandLineArgs.mode;
env = env?envLookup[env] || env:'development';

logger.info('Configuration Environment:', env);

var config = linkEnvValues(extend(true, {}, configFile.default, configFile[env], commandLineArgs));
config = applyLinks(config, config);

logger.info(require('util').inspect(config, {depth: null, colors: true}));

module.exports = config;
