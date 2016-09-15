(function(container){

  //Returns the object's class, Array, Date, RegExp, Object are of interest to us
  var getClass = function(val) {
    return Object.prototype.toString.call(val)
      .match(/^\[object\s(.*)\]$/)[1];
  };

  var clone = function(src){
    if(!src || typeof(src) !== 'object'){
      return src;
    }
    if(src instanceof Date){
      return new Date(src);
    }
    if(Array.isArray(src)){
      return src.map((item)=>clone(item));
    }
    if(src instanceof RegExp){
      return new RegExp(src);
    }
    var temp = (src.prototype)?Object.create(src.prototype):new src.constructor();
    Object.keys(src).forEach((key)=>{temp[key] = clone(src[key]);});
    return temp;
  };

  //Defines the type of the value, extended typeof
  var whatis = function(val) {

    if (val === undefined)
      return 'undefined';
    if (val === null)
      return 'null';

    var type = typeof val;

    if (type === 'object')
      type = getClass(val).toLowerCase();

    if (type === 'number') {
      if (val.toString().indexOf('.') > 0)
        return 'float';
      else
        return 'integer';
    }

    return type;
  };

  var compareObjects = function(a, b) {
    if (a === b)
      return true;
    for (var i in a) {
      if (b.hasOwnProperty(i)) {
        if (!Support.equal(a[i],b[i])) return false;
      } else {
        return false;
      }
    }

    for (var i in b) {
      if (!a.hasOwnProperty(i)) {
        return false;
      }
    }
    return true;
  };

  var compareArrays = function(a, b) {
    if (a === b)
      return true;
    if (a.length !== b.length)
      return false;
    for (var i = 0; i < a.length; i++){
      if(!equal(a[i], b[i])) return false;
    };
    return true;
  };

  var _equal = {};
  _equal.array = compareArrays;
  _equal.object = compareObjects;
  _equal.date = function(a, b) {
    return a.getTime() === b.getTime();
  };
  _equal.regexp = function(a, b) {
    return a.toString() === b.toString();
  };
  //	uncoment to support function as string compare
  //	_equal.fucntion =  _equal.regexp;

  container.Support = {
    noop: function(){},

    el: function(src, sel){
      if(!sel){
        sel = src;
        src = document;
      }
      return src.querySelector(sel);
    },

    els: function(src, sel){
      if(!sel){
        sel = src;
        src = document;
      }
      return Array.prototype.slice.call(src.querySelectorAll(sel));
    },

    val: function(from){
      return from.value||from.getAttribute('value')||from.innerText||from.innerHTML;
    },

    toHyphens: function(s){
      return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },

    toCamelCase: function(s){
      return s.toLowerCase().replace(/-(.)/g, function(match, group){
        return group.toUpperCase();
      });
    },

    paramByName: function(name, defaultValue) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
          results = regex.exec(location.search);
      return results == null ? defaultValue : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    filterParams: function(filter, defaultValues){
      var params = this.params(defaultValues),
          results = {},
          keys = Object.keys(params);
      keys.forEach(function(key){
        if(key.match(filter)){
          results[key] = params[key];
        }
      });
      return results;
    },

    param: function(val, defaultValue){
      var result = defaultValue,
          tmp = [];
      location.search
        .substr(1)
          .split("&")
          .forEach(function(item){
            tmp = item.split("=");
            if (tmp[0] === val){
              result = decodeURIComponent(tmp[1].replace(/\+/g, " "));
            }
          });
      return result;
    },

    reTrue: /^(true|t|yes|y|1)$/i,
    reFalse: /^(false|f|no|n|0)$/i,

    isTrue: function(value){
      return !!this.reTrue.exec(''+value);
    },

    isFalse: function(value){
      return !!this.reFalse.exec(''+value);
    },

    addCommas: function(x) {
      var parts = (x||0).toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    },

    isNumeric: function(n){
      return !isNaN(parseFloat(n)) && isFinite(n);
    },

    isFraction: function(n){
      return n.match(/^(\d+\W\d+\/\d+|\d+\/\d+)$/);
    },

    decodeValue: function(value){
      if(this.isNumeric(value)){
        return +value;
      }else if(this.isTrue(value)){
        return true;
      }else if(this.isFalse(value)){
        return false;
      }else{
        return value;
      }
    },

    hashParams: function(defaults){
      var q = location.hash.split('?'),
        d = function(s){
              return decodeURIComponent(s.replace(/\+/g, " "));
            },
        r  = /([^&=]+)=?([^&]*)/g,
        r2= /([^&=\[]+)\[(.*)\]/,
        r3= /([^&=\[]+)\]\[(.+)/,
        urlParams = {},
        key, value, e, e2, elem;
      q.shift();
      q = q.join('?');
      for(key in (defaults || {})){
        urlParams[key] = defaults[key];
      }
      while (e = r.exec(q)) {
        if(e[1].indexOf("[") === -1){
          // simple match, no [] identifiers
          urlParams[d(e[1])] = d(e[2]);
        }else{
          value = e[2];
          key = e[1];
          elem = urlParams;
          if(key.indexOf('][')===-1){
            while(e2=r2.exec(key)){
              key = e2[1];
              elem = elem[key] = elem[key] || {};
              key = e2[2];
            }
          }else{
            key = key.replace(/\]$/i, '');
            while(e2 = r3.exec(key)){
              key = e2[1];
              elem = elem[key] = elem[key] || {};
              if(e2[2]){
                key = e2[2];
              }
            }
          }
          if(!key){
            key = elem.length = elem.length||0;
            elem.length++;
          }
          elem[key] = value;
        }
      }
      return urlParams;
    },

    params: function(defaults){
      return this.parseParams(window.location.search.replace(/^\?/,''), true, defaults);
    },

    parseParams: function(paramStr, decodeValues, defaults){
      var self = this,
        q = paramStr||'',
        d = function (s) {
          var value = decodeURIComponent(s.replace(/\+/g, " "));
          if(decodeValues){
            value = self.decodeValue(value);
          }
          return value;
        },
        r  = /([^&=]+)=?([^&]*)/g,
        r2= /([^&=\[]+)\[(.*)\]/,
        r3= /([^&=\[]+)\]\[(.+)/,
        urlParams = {},
        key, value, e, e2, elem;
      if(typeof(decodeValues)==='object'){
        defaults = decodeValues;
        decodeValues = false;
      }
      for(key in (defaults || {})){
        urlParams[key] = defaults[key];
      }
      while (e = r.exec(q)) {
        if(e[1].indexOf("[") === -1){
          // simple match, no [] identifiers
          urlParams[d(e[1])] = d(e[2]);
        }else{
          value = e[2];
          key = e[1];
          elem = urlParams;
          if(key.indexOf('][')===-1){
            while(e2=r2.exec(key)){
              key = e2[1];
              elem = elem[key] = elem[key] || {};
              key = e2[2];
            }
          }else{
            key = key.replace(/\]$/i, '');
            while(e2 = r3.exec(key)){
              key = e2[1];
              elem = elem[key] = elem[key] || {};
              if(e2[2]){
                key = e2[2];
              }
            }
          }
          if(!key){
            key = elem.length = elem.length||0;
            elem.length++;
          }
          elem[key] = value;
        }
      }
      return urlParams;
    },

    pkg: function(from){
      var result = {};
      from.forEach(function(e){
        result[e.getAttribute('name')] = val(e);
      });
      return result;
    },

    classList: function(component, defaults){
      var result = defaults;
      var keys = (component.props.className||'').split(/[ \t]+/g);
      keys.forEach(function(key){
        result[key]=true;
      });
      return React.addons.classSet(result);
    },

    getAttrs: function(props, ex){
      var keys = Object.keys(props||{});
      var exclude = ['children'].concat(ex || []);
      var res = {};
      keys.forEach(function(key){
        if(exclude.indexOf(key)===-1){
          res[key] = props[key];
        }
      });
      return res;
    },

    defaults: function(obj, defs){
      var res = {};
      Object.keys(defs||{}).forEach(function(key){
        res[key] = defs[key];
      });
      Object.keys(obj||{}).forEach(function(key){
        res[key] = obj[key];
      });
      return res;
    },

    loadComponent: function(sourceLocation){
      Suport.loadComponents(Array.isArray(sourceLocation)?sourceLocation:[sourceLocation]);
    },

    loadComponents: function(sourceLocations){
      async.forEach(sourceLocations, function(sourceLocation, next){
        Loader.get(sourceLocation, function(err, source){
          if(err){
            alert(sourceLocation+' '+err.toString());
            return next();
          }
          babel.run(source);
          next();
        });
      }, function(err){
      });
    },

    equal: function(a, b){
      /*
       * Are two values equal, deep compare for objects and arrays.
       * @param a {any}
       * @param b {any}
       * @return {boolean} Are equal?
       */
      if (a !== b) {
        var atype = whatis(a), btype = whatis(b);

        if (atype === btype)
          return _equal.hasOwnProperty(atype) ? _equal[atype](a, b) : a==b;

        return false;
      }

      return true;
    },

    clone: clone,

    omit: function(src, omit){
      if(!src || typeof(src) !== 'object'){
        return src;
      }
      if(src instanceof Date){
        return new Date(src);
      }
      if(src instanceof Array){
        return src.map((item)=>clone(item));
      }
      if(src instanceof RegExp){
        return new RegExp(src);
      }
      var temp = (src.prototype)?Object.create(src.prototype):new src.constructor();
      omit = Array.isArray(omit)?omit:Array.prototype.slice.call(arguments, 1, arguments.length);
      var notOmit = function(item){
        return omit.indexOf(item)===-1;
      };
      var copyValue = function(key){
        temp[key] = src[key];
      };
      Object.keys(src).filter(notOmit).forEach(copyValue);
      return temp;
    },

    toCSV: function(data, options){
      /*
      options.delim = options.delim || ',';
        // Delimiter between fields defaults to ,
      options.textDelim = options.textDelim || '"';
        // Text delimiter to wrap text in, defaults to "
      options.eoln = options.eoln || '\r\n';
        // Line end character, defaults \r\n
      options.headerDelim = options.headerDelim || '_';
        // Delimiter when joining complex object type headings, defaults _
      options.escapeTextDelim = options.escapeTextDelim || ('\\'+options.textDelim);
        // Escape character for embedded text delimiter defaults to \" or \<textDelim>
      */
      var headers = [];
      var records = [];
      var line;
      var response = '';
      var i, l = data.length, rl=0, j, k;
      var reReplaceTextDelim;
      var processRecord = function(src, rec, prefix){
        var key, val, idx;
        prefix = prefix || '';
        rec = rec || new Array(headers.length);
        for(key in src){
          val = src[key];
          key = prefix+key;
          switch(typeof(val)){
            case('object'):
              if(val instanceof Array){
                processRecord(val, rec, key+options.headerDelim);
                break;
              }else if(!(val instanceof Date)){
                processRecord(val, rec, key+options.headerDelim);
                break;
              }
            default:
              if((idx = headers.indexOf(key))===-1){
                idx = headers.length;
                headers.push(key);
              }
              rec[idx] = val.toString();
          }
        }

        return rec;
      };

      options = options || {};
      options.delim = options.delim || ',';
      options.textDelim = options.textDelim || '"';
      options.eoln = options.eoln || '\r\n';
      options.headerDelim = options.headerDelim || '_';
      options.escapeTextDelim = options.escapeTextDelim || ('\\'+options.textDelim);
      reReplaceTextDelim = new RegExp(options.textDelim, 'gi');

      if(options.includeHeaders === void(0)){
        options.includeHeaders = true;
      }

      for(i=0; i<l; i++){
        line = processRecord(data[i]);
        if(rl < line.length){
          rl = line.length;
        }
        records.push(line);
      }
      if(options.includeHeaders){
        response = options.textDelim + headers.join(options.textDelim + options.delim + options.textDelim) + options.textDelim + options.eoln;
      }
      for(i=0; i<l; i++){
        line = records[i];
        if(line.length<rl){
          line = line.concat(new Array(rl-line.length));
        }
        k = line.length;
        for(j=0; j<k; j++){
          if(line[j] !== void(0)){
            response += options.textDelim + line[j].replace(reReplaceTextDelim, options.escapeTextDelim) + options.textDelim;
          }
          if(j<k-1){
            response += options.delim;
          }
        }
        response += options.eoln;
      }

      return response;
    },

  };
})(this);
