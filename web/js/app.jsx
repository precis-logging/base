var {
  RouteHandler,
  Route,
  DefaultRoute,
  Link,
} = ReactRouter;

var Nav = React.createClass({
  render(){
    return (<nav className="navbar navbar-inverse navbar-fixed-top">
      <div className="container-fluid">
        <div className="navbar-header">
          <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <a className="navbar-brand" href="#">Precis Dashboard</a>
        </div>
        <div id="navbar" className="navbar-collapse collapse">
          <InjectedComponentSet
            containerRequired={false}
            tagName="ul"
            className='nav navbar-nav navbar-right'
            matching={{role: 'primary-nav-action'}} />

          {/*
          <form className="navbar-form navbar-right">
            <input type="text" className="form-control" placeholder="Search..." />
          </form>
          //*/}
        </div>
      </div>
    </nav>)
  }
});

var Widget = React.createClass({
  render(){
    console.log(this.props)
    return (<div className="col-xs-6 col-sm-3 placeholder">
              <img src="http://placehold.it/200x200" />
              <h4>Label</h4>
              <span className="text-muted">Something else</span>
            </div>)
  }
});

var Dashboard = React.createClass({
  render(){
    return(
      <div>
        <h1 className="page-header">Dashboard</h1>

        <InjectedComponentSet
          tagName="div"
          containerRequired={true}
          containerClassName="col-xs-6 col-sm-3 placeholder"
          className='row placeholders'
          matching={{role: 'dashboard-widget'}} />
        <InjectedComponentSet
          tagName="div"
          containerRequired={false}
          matching={{role: 'dashboard-section'}} />
      </div>
    );
  }
});

var PageLayout = React.createClass({
  contextTypes:{
    router: React.PropTypes.func
  },
  render(){
    var pages = this.props.pages||[];
    var sectionsInfo = pages.reduce(function(secs, curr){
      var section = curr.section || 'default';
      var key = curr.componentName;
      var {
        path,
        title
      } = curr;
      var sec = secs[section] || (secs[section] = []);
      sec.push(<li key={key}><Link to={path}>{title}</Link></li>);
      return secs;
    }, {default: [<li key="default"><Link to="/">Dashboard</Link></li>]});
    var sections = Object.keys(sectionsInfo).map(function(sectionTitle, index){
      return (<ul className="nav nav-sidebar" key={"section"+index}>
        {sectionsInfo[sectionTitle]}
      </ul>);
    });
    return (
      <div>
        <Nav />
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-3 col-md-2 sidebar">{sections}</div>
              <div className="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main">
                <RouteHandler />
              </div>
            </div>
          </div>
      </div>
    )
  }
});

Loader.get('/api/v1/ui/pages', function(err, pages){
  if(err){
    return alert('/api/v1/ui/components '+err.toString());
  }
  Loader.get('/api/v1/ui/components', function(err, components){
    if(err){
      return alert('/api/v1/ui/components '+err.toString());
    }
    Support.loadComponents(components);
    var pgs = [
      <DefaultRoute name="dashboard" handler={Dashboard} key="defualt"/>,
    ].concat(pages.map(function(page){
      return <Route name={page.path} handler={window[page.componentName]} key={page.componentName} />
    }));
    var routes = (
          <Route path="/" handler={PageLayout}>
            {pgs}
          </Route>
        );

    window.Router = ReactRouter.run(routes, function(Handler){
      React.render(<Handler pages={pages}/>, document.body);
    });
  });
});
