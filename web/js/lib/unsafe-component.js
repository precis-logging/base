
/*
Public: Renders a component provided via the `component` prop, and ensures that
failures in the component's code do not cause state inconsistencies elsewhere in
the application. This component is used by {InjectedComponent} and
{InjectedComponentSet} to isolate third party code that could be buggy.

Occasionally, having your component wrapped in {UnsafeComponent} can cause style
issues. For example, in a Flexbox, the `div.unsafe-component-wrapper` will cause
your `flex` and `order` values to be one level too deep. For these scenarios,
UnsafeComponent looks for `containerStyles` on your React component and attaches
them to the wrapper div:

```coffee
class MyComponent extends React.Component
  @displayName: 'MyComponent'
  @containerStyles:
    flex: 1
    order: 2
```

Section: Component Kit
 */

(function() {
  var UnsafeComponent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.UnsafeComponent = UnsafeComponent = (function(superClass) {
    extend(UnsafeComponent, superClass);

    function UnsafeComponent() {
      this.blur = bind(this.blur, this);
      this.focus = bind(this.focus, this);
      this.unmountInjected = bind(this.unmountInjected, this);
      this.renderInjected = bind(this.renderInjected, this);
      this.render = bind(this.render, this);
      this.componentWillUnmount = bind(this.componentWillUnmount, this);
      this.componentDidUpdate = bind(this.componentDidUpdate, this);
      this.componentDidMount = bind(this.componentDidMount, this);
      return UnsafeComponent.__super__.constructor.apply(this, arguments);
    }

    UnsafeComponent.displayName = 'UnsafeComponent';


    /*
    Public: React `props` supported by UnsafeComponent:

     - `component` The {React.Component} to display. All other props will be
       passed on to this component.
     */

    UnsafeComponent.propTypes = {
      component: React.PropTypes.func.isRequired
    };

    UnsafeComponent.prototype.componentDidMount = function() {
      return this.renderInjected();
    };

    UnsafeComponent.prototype.componentDidUpdate = function() {
      return this.renderInjected();
    };

    UnsafeComponent.prototype.componentWillUnmount = function() {
      return this.unmountInjected();
    };

    UnsafeComponent.prototype.render = function() {
      var ref;
      return React.createElement("div", {
        "name": "unsafe-component-wrapper",
        "style": ((ref = this.props.component) != null ? ref.containerStyles : void 0)
      });
    };

    UnsafeComponent.prototype.renderInjected = function() {
      var element, err, node, props, stack, stackEnd;
      node = React.findDOMNode(this);
      element = null;
      try {
        props = _.omit(this.props, _.keys(this.constructor.propTypes));
        element = React.createElement(this.props.component, React.__spread({
          "key": name
        }, props));
        this.injected = React.render(element, node);
      } catch (_error) {
        err = _error;
        console.error(err);
        stack = err.stack;
        console.log(stack);
        stackEnd = stack.indexOf('/react/');
        if (stackEnd > 0) {
          stackEnd = stack.lastIndexOf('\n', stackEnd);
          stack = stack.substr(0, stackEnd);
        }
        element = React.createElement("div", {
          "className": "unsafe-component-exception"
        }, React.createElement("div", {
          "className": "message"
        }, this.props.component.displayName, " could not be displayed."), React.createElement("div", {
          "className": "trace"
        }, stack));
      }
      return this.injected = React.render(element, node);
    };

    UnsafeComponent.prototype.unmountInjected = function() {
      var err, node;
      try {
        node = React.findDOMNode(this);
        return React.unmountComponentAtNode(node);
      } catch (_error) {
        err = _error;
      }
    };

    UnsafeComponent.prototype.focus = function() {
      if (this.injected.focus != null) {
        return this.injected.focus();
      }
    };

    UnsafeComponent.prototype.blur = function() {
      if (this.injected.blur != null) {
        return this.injected.blur();
      }
    };

    return UnsafeComponent;

  })(React.Component);

}).call(this);
