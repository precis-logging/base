
/*
Public: InjectedComponent makes it easy to include dynamically registered
components inside of your React render method. Rather than explicitly render
a component, such as a `<Composer>`, you can use InjectedComponent:

```coffee
<InjectedComponent matching={role:"Composer"} exposedProps={draftId:123} />
```

InjectedComponent will look up the component registered with that role in the
{ComponentStore} and render it, passing the exposedProps (`draftId={123}`) along.

InjectedComponent monitors the ComponentStore for changes. If a new component
is registered that matches the descriptor you provide, InjectedComponent will refresh.

If no matching component is found, the InjectedComponent renders an empty div.

Section: Component Kit
 */

(function() {
  var InjectedComponent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  var getComponentReactElement = function(options){
      if (options.containerRequired === false) {
        return React.createElement("component", React.__spread({
          "ref": "inner",
          "key": options.displayName
        }, options.exposedProps));
      }
      return React.createElement(UnsafeComponent, React.__spread({
        "ref": "inner",
        "component": options.component,
        "key": options.displayName
      }, options.exposedProps));
    };

  window.InjectedComponent = InjectedComponent = (function(superClass) {
    extend(InjectedComponent, superClass);

    InjectedComponent.displayName = 'InjectedComponent';

    /*
    Public: React `props` supported by InjectedComponent:

     - `matching` Pass an {Object} with ComponentStore descriptors.
        This set of descriptors is provided to {ComponentStore::findComponentsForDescriptor}
        to retrieve the component that will be displayed.

     - `className` (optional) A {String} class name for the containing element.

     - `exposedProps` (optional) An {Object} with props that will be passed to each
        item rendered into the set.
     */

    InjectedComponent.propTypes = {
      matching: React.PropTypes.object.isRequired,
      className: React.PropTypes.string,
      exposedProps: React.PropTypes.object
    };

    function InjectedComponent(props1) {
      this.props = props1;
      this._getStateFromStores = bind(this._getStateFromStores, this);
      this.blur = bind(this.blur, this);
      this.focus = bind(this.focus, this);
      this.render = bind(this.render, this);
      this.componentWillReceiveProps = bind(this.componentWillReceiveProps, this);
      this.componentWillUnmount = bind(this.componentWillUnmount, this);
      this.componentDidMount = bind(this.componentDidMount, this);
      this.state = this._getStateFromStores();
    }

    InjectedComponent.prototype.componentDidMount = function() {
      return this._componentUnlistener = ComponentStore.listen((function(_this) {
        return function() {
          return _this.setState(_this._getStateFromStores());
        };
      })(this));
    };

    InjectedComponent.prototype.componentWillUnmount = function() {
      if (this._componentUnlistener) {
        return this._componentUnlistener();
      }
    };

    InjectedComponent.prototype.componentWillReceiveProps = function(newProps) {
      var ref;
      if (!_.isEqual(newProps.matching, (ref = this.props) != null ? ref.matching : void 0)) {
        return this.setState(this._getStateFromStores(newProps));
      }
    };

    InjectedComponent.prototype.render = function() {
      var className, component, element, exposedProps, ref, ref1;
      if (!this.state.component) {
        return React.createElement("div", null);
      }
      exposedProps = (ref = this.props.exposedProps) != null ? ref : {};
      className = (ref1 = this.props.className) != null ? ref1 : "";
      if (this.state.visible) {
        className += "registered-region-visible";
      }
      component = this.state.component;
      console.log('InjectedComponent.prototype.render', component)
      element = getComponentReactElement({
        containerRequired: component.containerRequired,
        displayName: component.displayName,
        component: component,
        exposedProps: exposedProps,
      });

      /* Replaced with above
      if (component.containerRequired === false) {
        element = React.createElement("component", React.__spread({
          "ref": "inner",
          "key": component.displayName
        }, exposedProps));
      } else {
        if (component.containerRequired !== false) {
          element = React.createElement(UnsafeComponent, React.__spread({
            "ref": "inner",
            "component": component,
            "key": component.displayName
          }, exposedProps));
        }
      }
      //*/

      if (this.state.visible) {
        return React.createElement("div", {
          "className": className
        }, element, React.createElement(InjectedComponentLabel, React.__spread({
          "matching": this.props.matching
        }, exposedProps)), React.createElement("span", {
          "style": {
            clear: 'both'
          }
        }));
      }
      return React.createElement("div", {
        "className": className
      }, element);
    };

    InjectedComponent.prototype.focus = function() {
      var ref;
      if (((ref = this.refs.inner) != null ? ref.focus : void 0) != null) {
        return this.refs.inner.focus();
      }
    };

    InjectedComponent.prototype.blur = function() {
      var ref;
      if (((ref = this.refs.inner) != null ? ref.blur : void 0) != null) {
        return this.refs.inner.blur();
      }
    };

    InjectedComponent.prototype._getStateFromStores = function(props) {
      var components;
      if (props == null) {
        props = this.props;
      }
      components = ComponentStore.findComponentsMatching(props.matching);
      if (components.length > 1) {
        console.warn("There are multiple components available for " + (JSON.stringify(props.matching)) + ". <InjectedComponent> is only rendering the first one.");
      }
      return {
        component: components[0],
        visible: ComponentStore.showComponentRegions()
      };
    };

    return InjectedComponent;
  })(React.Component);

}).call(this);
