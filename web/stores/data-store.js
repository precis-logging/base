// Ideally, the DataStore would return immutable objects,
// and be backed by something like IndexedDB in localstorage.
//
// For the purposes of this example, it just stores objects
// in a flat array.
//

var prefetchData = function(storeConfig, r){
  if(storeConfig.socketEvent.prefetch){
    Loader.get(storeConfig.socketEvent.prefetch, function(err, records){
      if(err){
        return console.error(err);
      }
      records.forEach(function(record){
        if(r){
          return DataStore.persist(r.reform(record));
        }
        DataStore.persist(record);
      });
    });
  }
};

var setupDataStores = function(){
  Loader.get('/api/v1/ui/stores', function(err, stores){
    if(err){
      alert(err);
      return console.error(err);
    }
    stores.forEach(function(storeConfig){
      DataStore.createStore(storeConfig.name, storeConfig.filter);
      if(storeConfig.socketEvent && storeConfig.socketEvent.event){
        if(!storeConfig.socketEvent.reform){
          socket.on(storeConfig.socketEvent.event, function(data){
            DataStore.persist(data);
          });
          return prefetchData(storeConfig);
        }
        var r = new Reform(storeConfig.socketEvent.reform);
        socket.on(storeConfig.socketEvent.event, function(data){
          DataStore.persist(r.reform(data));
        });
        return prefetchData(storeConfig, r);
      }
    });
    DataStore._ready = true;
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

  persist: function(model){
    var idx = _.findIndex(this._items, _.matcher({id: model.id}));
    (idx !== -1)?this._items[idx] = model:this._items.push(model);

    this.trigger();
  },

  createStore: function(name, filter){
    var Store = this._stores[name];
    if(Store){
      throw new Error('Store "'+name+'" already exsits!');
    }
    var Store = Reflux.createStore({
      init: function(){
        this.listenTo(DataStore, this.onDataChange);
        this._items = DataStore.itemsMatching(filter);
        this._latest= 'Waiting';
      },
      items: function(){
        return this._items;
      },
      latest: function(){
        return this._latest.counter;
      },
      onDataChange: function(){
        this._items = DataStore.itemsMatching(filter);
        this._latest = this._items[this._items.length-1];
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
