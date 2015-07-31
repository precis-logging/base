var React = require('react/addons');
var Support = require('../lib/support');
var Loader = require('../lib/loader');
var bus = require('../lib/eventbus');

var {
    classList,
    getAttrs,
    el,
    val,
    defaults,
  } = Support;

var {
  router,
  RouteLink
} = require('../lib/router.jsx');

router.add({
  '/home': require('../views/home.jsx'),
});

var Layout = React.createClass({
  getInitialState: function(){
    bus.on('page::change', function(newPage){
      return this.setState({
        pageName: newPage
      });
    }.bind(this));
    return {
      pageName: this.props.pageName||'/home'
    };
  },
  setPage: function(pageName){
    router.setPage(pageName);
    this.setState({
      pageName: pageName||'/home'
    });
  },
  render: function(){
    var pageName = this.state.pageName;
    var props = getAttrs(this.props, []);
    var page = router.get(pageName);
    var props = defaults(props, page.params);
    var appPage = page.view(props);
    return (
      <div {...props}>
        {appPage}
      </div>
    );
  }
});

module.exports = Layout;
