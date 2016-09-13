// Ideally, the DataStore would return immutable objects,
// and be backed by something like IndexedDB in localstorage.
//
// For the purposes of this example, it just stores objects
// in a flat array.
//

var fetchAll = function(options, callback){
  var from = options.url;
  var limit = options.limit;
  var results = [];
  var parts = from.split('?');
  var options = (parts.length>1)?parts.pop().split('&'):[];
  var fetchBlock = function(offset){
    var url = from+'?'+options.concat(['offset='+offset]).join('&');
    Loader.get(url, function(err, records){
      if(err){
        return callback(err);
      }
      if(records instanceof Array){
        return callback(null, records);
      }
      if(records.items && records.items.length){
        results = results.concat(records.items);
        if(limit && (results.length >= limit)){
          return callback(null, results.slice(0, limit));
        }
        return fetchBlock(offset+records.items.length);
      }
      return callback(null, results);
    });
  };
  fetchBlock(0);
};

var prefetchData = function(storeConfig, r, callback){
  if(typeof(r)==='function'){
    callback = r;
    r = null;
  }
  if(!storeConfig.socketEvent){
    return (callback||noop)(null, []);
  }
  if(storeConfig.socketEvent.prefetch){
    return fetchAll({url: storeConfig.socketEvent.prefetch, limit: storeConfig.limit}, function(err, records){
      if(err){
        console.error(err);
        return (callback||noop)(err);
      }
      if(!records){
        return (callback||noop)();
      }
      records.forEach(function(record){
        record._type = storeConfig.name;
        if(r){
          return DataStore.persist(r.reform(record));
        }
        DataStore.persist(record);
      });
      return (callback||noop)(null, records);
    });
  }
  return (callback||noop)(null, []);
};

var setupDataStores = function(){
  Loader.get('/api/v1/ui/stores', function(err, stores){
    if(err){
      alert(err);
      return console.error(err);
    }
    async.each(stores, function(storeConfig, next){
      var store = DataStore.createStore(storeConfig);
      if(storeConfig.socketEvent && storeConfig.socketEvent.event){
        if(!storeConfig.socketEvent.reform){
          socket.on(storeConfig.socketEvent.event, function(data){
            data._type = storeConfig.name;
            DataStore.persist(data);
          });
          return prefetchData(storeConfig, function(){
            next();
          });
        }
        var r = new Reform(storeConfig.socketEvent.reform);
        socket.on(storeConfig.socketEvent.event, function(data){
          data._type = storeConfig.name;
          DataStore.persist(r.reform(data));
        });
        return prefetchData(storeConfig, r, function(){
          next();
        });
      }
      return next();
    }, function(err){
      if(err){
        console.error(err);
      }
      DataStore._ready = true;
    });
  });
};

window.DataStore = Reflux.createStore({
  init: function(){
    this.listenTo(Actions.persistData, this.persist);

    this._stores = {};
    this._items = [];
    this._ready = false;
    setupDataStores();
  },

  itemsMatching: function(attributes){
    return _.where(this._items, attributes);
  },

  GC: function(){
    this._items = this._items.slice(Math.max(0, this._items.length-5000), this._items.length);
  },

  persist: function(models){
    var type = models._type;
    var records = Array.isArray(models)?models:[models];
    records.forEach(function(model){
      this.persistRecord(Object.assign({}, model, {_type: type}));
    }.bind(this));
  },

  persistRecord: function(model){
    var idx = model._id?_.findIndex(this._items, _.matcher({_id: model._id, _type: model._type})):
              _.findIndex(this._items, _.matcher({id: model.id}));
    (idx !== -1)?this._items[idx] = model:this._items.push(model);
    this.GC();

    this.trigger();
  },

  createStore: function(options){
    var name = options.name;
    var filter = options.filter||{_type: options.name};
    var limit = options.limit;
    var Store = this._stores[name];
    if(Store){
      throw new Error('Store "'+name+'" already exsits!');
    }
    var Store = Reflux.createStore({
      init: function(){
        this.listenTo(DataStore, this.onDataChange);
        this._items = DataStore.itemsMatching(filter);
        //this._latest= 'Waiting';
      },
      items: function(){
        return this._items;
      },
      /*
      latest: function(){
        return this._latest.counter;
      },
      */
      onDataChange: function(){
        this._items = DataStore.itemsMatching(filter);
        /*
        this._latest = this._items[this._items.length-1];
        if(limit && (this._items.length > limit)){
          this._items = this._items.slice(this._items.length-limit, limit);
        }
        */
        this.trigger();
      }
    });
    this._stores[name] = Store;
    return Store;
  },

  getStore: function(name, callback){
    if(!this._ready){
      var self = this;
      return setTimeout(function(){
        self.getStore(name, callback);
      }, 100);
    }
    var Store = this._stores[name];
    if(Store){
      return callback(null, Store);
    }
    return callback(new Error('Unknown store "'+name+'"!'));
  },
});
