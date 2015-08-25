//*
window.PagesStore = Reflux.createStore({
  init: function() {
    this.listenTo(Pages.register, this._onRegister);
    this.listenTo(Pages.unregister, this._onUnregister);

    this._items = []
    this._showComponentRegions = false;
  },

  findMatching: function(name) {
    return this._items.filter(function(item){
      return item.name === name;
    });
  },

  page: function(name){
    var items = this._items.filter(function(item){
      return item.name === name;
    });
    if(items && items.length){
      return items[0].page;
    }
    return null;
  },

  pages: function(){
    return this._items;
  },

  _onRegister: function(name, page) {
    this._items.push({
      name: name,
      page: page
    });
    this.trigger();
  },

  _onUnregister: function(name) {
    var idx = this._items.indexOf(name);
    if (idx != -1) {
      this._items.splice(idx, 1);
      this.trigger();
    }
  }
});
//*/
