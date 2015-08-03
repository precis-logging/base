
/*
Public: A simple wrapper that provides a Flexbox layout with the given direction and style.
Any additional props you set on the Flexbox are rendered.
 */

(function() {
  var Flexbox,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.Flexbox = Flexbox = (function(superClass) {
    extend(Flexbox, superClass);

    function Flexbox() {
      return Flexbox.__super__.constructor.apply(this, arguments);
    }

    Flexbox.displayName = 'Flexbox';


    /*
    Public: React `props` supported by Flexbox:

     - `direction` (optional) A {String} Flexbox direction: either `column` or `row`.
     - `style` (optional) An {Object} with styles to apply to the flexbox.
     */

    Flexbox.propTypes = {
      direction: React.PropTypes.string,
      inline: React.PropTypes.bool,
      style: React.PropTypes.object
    };

    Flexbox.prototype.render = function() {
      var otherProps, style;
      style = _.extend(this.props.style || {}, {
        'flexDirection': this.props.direction,
        'position': 'relative',
        'display': 'flex',
        'height': '100%'
      });
      if (this.props.inline === true) {
        style.display = 'inline-flex';
      }
      otherProps = _.omit(this.props, _.keys(this.constructor.propTypes));
      return React.createElement("div", React.__spread({
        "style": style
      }, otherProps), this.props.children);
    };

    return Flexbox;

  })(React.Component);

}).call(this);
