var {
  RouteHandler,
  Route,
  DefaultRoute
} = ReactRouter;

var RouteWelcome = React.createClass({
  contextTypes:{
    router: React.PropTypes.func
  },
  render: function(){
    return (
      <div><h1>Hello World!</h1></div>
    )
  }
});

var routes = (
      <Route path="/">
        <DefaultRoute name="welcome" handler={RouteWelcome} />
      </Route>
    );

window.Router = ReactRouter.run(routes, function(Handler){
  React.render(<Handler/>, document.querySelector('#application'));
});
