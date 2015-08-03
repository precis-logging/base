window.ComponentStore = Reflux.createStore({
  init: function() {
    this.listenTo(Actions.register, this._onRegister);
    this.listenTo(Actions.unregister, this._onUnregister);
    this.listenTo(Actions.toggleShowRegions, this._onToggleRegions);

    this._items = []
    this._showComponentRegions = false;
  },

  findComponentsMatching: function(rule) {
    return this._items.filter(function(item){
      return Support.equal(rule, item.rules);
    }).map(function(item){
      return item.component;
    });
  },

  showComponentRegions: function() {
    return this._showComponentRegions;
  },

  _onToggleRegions: function() {
    this._showComponentRegions = !this._showComponentRegions;
    this.trigger();
  },

  _onRegister: function(component, rules) {
    this._items.push({
      component: component,
      rules: rules
    });
    this.trigger();
  },

  _onUnregister: function(component) {
    var idx = this._items.indexOf(component);
    if (idx != -1) {
      this._items.splice(idx, 1);
      this.trigger();
    }
  }
});
