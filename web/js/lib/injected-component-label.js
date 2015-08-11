
/*
Public: A small component that displays a string describing
the role and exposed props of an InjectedComponentSet:

location: 'composer-actions' (draft: <object>, ids: <array>)
 */

(function() {
  var InjectedComponentLabel,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.InjectedComponentLabel = InjectedComponentLabel = (function(superClass) {
    extend(InjectedComponentLabel, superClass);

    function InjectedComponentLabel() {
      return InjectedComponentLabel.__super__.constructor.apply(this, arguments);
    }

    InjectedComponentLabel.displayName = 'InjectedComponentLabel';

    InjectedComponentLabel.prototype.render = function() {
      var description, key, matchingDescriptions, propDescriptions, ref, ref1, ref2, ref3, val;
      matchingDescriptions = [];
      ref = this.props.matching;
      for (key in ref) {
        val = ref[key];
        if (key === 'location') {
          val = val.id;
        }
        if (key === 'locations') {
          val = _.pluck(val, 'id');
        }
        matchingDescriptions.push(key + ": " + val);
      }
      propDescriptions = [];
      ref1 = this.props;
      for (key in ref1) {
        val = ref1[key];
        if (key === 'matching') {
          continue;
        }
        propDescriptions.push(key + ":<" + ((ref2 = val != null ? (ref3 = val.constructor) != null ? ref3.name : void 0 : void 0) != null ? ref2 : typeof val) + ">");
      }
      description = " " + (matchingDescriptions.join(', '));
      if (propDescriptions.length > 0) {
        description += " (" + (propDescriptions.join(', ')) + ")";
      }
      return React.createElement("span", {
        "className": "name"
      }, description);
    };

    return InjectedComponentLabel;
  })(React.Component);

}).call(this);
