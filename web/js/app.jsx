var {
  RouteHandler,
  Route,
  DefaultRoute,
  Link,
  NotFoundRoute,
} = ReactRouter;

var escapeHTML = window.escapeHTML = (function(){
  var div = document.createElement('div');
  return function(str){
    div.innerHTML = '';
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };
})();

var objStr = {}.toString();

var JSONNode = window.JSONNode = React.createClass({
  makeTreeFrom(obj, lvl){
    var styles = {
      object: {
        color: 'blue',
      },
      array: {
        color: 'darkorange',
      },
      string: {
        color: 'green',
      },
      number: {
        color: 'brown',
      },
      boolean: {
        color: 'blueviolet',
      },
      key: {
        color: '#333333',
      },
    };
    var level = lvl || 0;
    var keys = Object.keys(obj);
    var isArray = Array.isArray(obj);
    var prefix = isArray?'[':'{';
    var postfix = isArray?']':'}';
    var listStyle = {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontFamily: 'monospace',
      };
    var itemStyle = {
        paddingLeft: '1.25em',
      };
    var reformItem = function(key, value, isLast){
        var type = typeof(value);
        var ekey = '"'+escapeHTML(key)+'"';
        var postfix = isLast?<span style={{display: 'none'}} />:',';
        if(Array.isArray(value)){
          return <li style={itemStyle} className="sub-node" key={key}><span style={styles.key}>{ekey}</span>: <span style={styles.array}>{this.makeTreeFrom(value, level+1)}</span>{postfix}</li>;
        }
        if((value === null) || (value === undefined)){
          value = ''+value;
          return <li style={itemStyle} className="sub-node" key={key}><span style={styles.key}>{ekey}</span>: <span  style={styles[type]}>{escapeHTML(value)}</span>{postfix}</li>;
        }
        if((type === 'object') && (value.toString()===objStr)){
          return <li style={itemStyle} className="sub-node" key={key}><span style={styles.key}>{ekey}</span>: <span  style={styles[type]}>{this.makeTreeFrom(value, level+1)}</span>{postfix}</li>;
        }
        if(type==='string'){
          value = '"'+value+'"';
        }
        return <li style={itemStyle} className="sub-node" key={key}><span style={styles.key}>{ekey}</span>: <span  style={styles[type]}>{escapeHTML(value)}</span>{postfix}</li>;
      }.bind(this);
    var reformArray = function(key, value, isLast){
      var type = typeof(value);
      var postfix = isLast?<span style={{display: 'none'}} />:',';
      if(Array.isArray(value)){
        return <li style={itemStyle} className="sub-node" key={key}><span style={styles.array}>{this.makeTreeFrom(value, level+1)}</span>{postfix}</li>;
      }
      if((type === 'object') && (value.toString()===objStr)){
        return <li style={itemStyle} className="sub-node" key={key}><span  style={styles[type]}>{this.makeTreeFrom(value, level+1)}</span>{postfix}</li>;
      }
      if(type==='string'){
        value = '"'+value+'"';
      }
      return <li style={itemStyle} className="sub-node" key={key}><span  style={styles[type]}>{escapeHTML(value)}</span>{postfix}</li>;
    }.bind(this);
    var items = isArray?obj.map((item, index, arr)=>reformArray(index, item, arr.length-1 === index)):keys.map((key, index, arr)=>reformItem(key, obj[key], arr.length-1 === index));

    return (
      <span className={'json-node'} style={styles[(Array.isArray(obj)?'array':typeof(obj))]}>
        {prefix}
        <ul style={listStyle}>
          {items}
        </ul>
        {postfix}
      </span>
    );
  },
  render(){
    var obj = this.props.obj;
    var tree = this.makeTreeFrom(obj);
    return (
      <div style={{fontFamily: 'monospace'}}>
        {tree}
      </div>
    );
  }
});

var published = function(page){
  return (page.path.indexOf('/:')===-1) && (page.title);
};

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
          <a className="navbar-brand" href="#">{CONFIG.name}</a>
        </div>
        <div id="navbar" className="navbar-collapse collapse">
          <InjectedComponentSet
            containerRequired={false}
            tagName="ul"
            className='nav navbar-nav navbar-right'
            matching={{role: 'primary-nav-action'}} />

          {/*// Add this back in if you want search
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
    var sectionsInfo = pages.filter(published).reduce(function(secs, curr){
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
      var title = sectionTitle === 'default'?'':sectionTitle;
      return (<ul className="nav nav-sidebar" key={"section"+index}>
        {title}
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

var RouteNotFound = React.createClass({
  render(){
    return (
      <div class="container">
        <div class="row">
          <div class="col-md-12">
            <div class="error-template">
              <h1>Oops!</h1>
              <h2>404 Not Found</h2>
              <div class="error-details">
                Sorry, an error has occured, Requested page not found!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
      <NotFoundRoute handler={RouteNotFound} key="notFoundRoute"/>,
    ].concat(pages.map(function(page){
      return <Route name={page.path} handler={PagesStore.page(page.componentName)} key={page.componentName} />
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
