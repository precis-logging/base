var {
  RouteHandler,
  Route,
  DefaultRoute
} = ReactRouter;

var RouteWelcome = React.createClass({
  contextTypes:{
    router: React.PropTypes.func
  },
  componentDidMount(){
  },
  render(){
    return (
      <div>
        <h1>Hello World!</h1>
        <h2>Message-Action Items</h2>
        <InjectedComponentSet
          className='actions'
          matching={{role: 'message-action'}} />
        <h2>Test-Component Items</h2>
        <InjectedComponentSet
          className='actions'
          matching={{role: 'test-component'}} />
      </div>
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

Loader.get('/api/v1/ui/components', function(err, components){
  if(err){
    return alert('/api/v1/ui/components '+err.toString());
  }
  Support.loadComponents(components);
});
