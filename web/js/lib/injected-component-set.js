
/*
Public: InjectedComponent makes it easy to include a set of dynamically registered
components inside of your React render method. Rather than explicitly render
an array of buttons, for example, you can use InjectedComponentSet:

```coffee
<InjectedComponentSet className="message-actions"
                  matching={role: 'ThreadActionButton'}
                  exposedProps={thread:@props.thread, message:@props.message}>
```

InjectedComponentSet will look up components registered for the location you provide,
render them inside a {Flexbox} and pass them `exposedProps`. By default, all injected
children are rendered inside {UnsafeComponent} wrappers to prevent third-party code
from throwing exceptions that break React renders.

InjectedComponentSet monitors the ComponentStore for changes. If a new component
is registered into the location you provide, InjectedComponentSet will re-render.

If no matching components is found, the InjectedComponent renders an empty span.
 */

(function() {
  var InjectedComponentSet,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.InjectedComponentSet = InjectedComponentSet = (function(superClass) {
    extend(InjectedComponentSet, superClass);

    InjectedComponentSet.displayName = 'InjectedComponentSet';


    /*
    Public: React `props` supported by InjectedComponentSet:

     - `matching` Pass an {Object} with ComponentStore descriptors
        This set of descriptors is provided to {ComponentStore::findComponentsForDescriptor}
        to retrieve components for display.
     - `className` (optional) A {String} class name for the containing element.
     - `children` (optional) Any React elements rendered inside the InjectedComponentSet
        will always be displayed.
     - `exposedProps` (optional) An {Object} with props that will be passed to each
        item rendered into the set.

     -  Any other props you provide, such as `direction`, `data-column`, etc.
        will be applied to the {Flexbox} rendered by the InjectedComponentSet.
     */

    InjectedComponentSet.propTypes = {
      matching: React.PropTypes.object.isRequired,
      children: React.PropTypes.array,
      className: React.PropTypes.string,
      exposedProps: React.PropTypes.object
    };

    InjectedComponentSet.defaultProps = {
      direction: 'row'
    };

    function InjectedComponentSet(props1) {
      this.props = props1;
      this._getStateFromStores = bind(this._getStateFromStores, this);
      this.render = bind(this.render, this);
      this.componentWillReceiveProps = bind(this.componentWillReceiveProps, this);
      this.componentWillUnmount = bind(this.componentWillUnmount, this);
      this.componentDidMount = bind(this.componentDidMount, this);
      this.state = this._getStateFromStores();
    }

    InjectedComponentSet.prototype.componentDidMount = function() {
      return this._componentUnlistener = ComponentStore.listen((function(_this) {
        return function() {
          return _this.setState(_this._getStateFromStores());
        };
      })(this));
    };

    InjectedComponentSet.prototype.componentWillUnmount = function() {
      if (this._componentUnlistener) {
        return this._componentUnlistener();
      }
    };

    InjectedComponentSet.prototype.componentWillReceiveProps = function(newProps) {
      var ref;
      if (newProps.location !== ((ref = this.props) != null ? ref.location : void 0)) {
        return this.setState(this._getStateFromStores(newProps));
      }
    };

    InjectedComponentSet.prototype.render = function() {
      var elements, exposedProps, flexboxClassName, flexboxProps, ref, ref1, ref2;
      flexboxProps = _.omit(this.props, _.keys(this.constructor.propTypes));
      flexboxClassName = (ref = this.props.className) != null ? ref : "";
      exposedProps = (ref1 = this.props.exposedProps) != null ? ref1 : {};
      elements = this.state.components.map(function(component) {
        if (component.containerRequired === false) {
          return React.createElement("component", React.__spread({
            "key": component.displayName
          }, exposedProps));
        } else {
          return React.createElement(UnsafeComponent, React.__spread({
            "component": component,
            "key": component.displayName
          }, exposedProps));
        }
      });
      if (this.state.visible) {
        flexboxClassName += " registered-region-visible";
        elements.splice(0, 0, React.createElement(InjectedComponentLabel, React.__spread({
          "key": "_label",
          "matching": this.props.matching
        }, exposedProps)));
        elements.push(React.createElement("span", {
          "key": "_clear",
          "style": {
            clear: 'both'
          }
        }));
      }
      return React.createElement(Flexbox, React.__spread({
        "className": flexboxClassName
      }, flexboxProps), elements, (ref2 = this.props.children) != null ? ref2 : []);
    };

    InjectedComponentSet.prototype._getStateFromStores = function(props) {
      if (props == null) {
        props = this.props;
      }
      return {
        components: ComponentStore.findComponentsMatching(this.props.matching),
        visible: ComponentStore.showComponentRegions()
      };
    };

    return InjectedComponentSet;

  })(React.Component);

}).call(this);
