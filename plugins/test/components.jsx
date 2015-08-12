var {
  Link,
} = ReactRouter;

var addCommas=(x)=>{
  var parts = (x||'').toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

var TestWidget = React.createClass({
  displayName: 'Test Widget',
  getInitialState(){
    return {
      value: 'Waiting'
    };
  },
  componentDidMount(){
    DataStore.getStore('TestStore', function(err, TestStore){
      if(err){
        alert(err);
        return console.error(err);
      }
      this.unlisten = TestStore.listen(()=>{
        this.setState({
          value: TestStore.latest()
        });
      });
      this.setState({
        value: TestStore.latest()
      });
    }.bind(this));
  },
  componentWillUnmount(){
    this.unlisten&&this.unlisten();
  },
  render(){
    return (
      <div>
        <img src="http://placehold.it/200x200" />
        <h4>Test Widget</h4>
        <span className="text-muted">This is a basic test Widget</span>
        <div>Counter: {addCommas(this.state.value)}</div>
      </div>
    );
  }
});

Actions.register(TestWidget, {role: 'dashboard-widget'});

var TestTable = React.createClass({
  render(){
    return (
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Header</th>
              <th>Header</th>
              <th>Header</th>
              <th>Header</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1,001</td>
              <td>Lorem</td>
              <td>ipsum</td>
              <td>dolor</td>
              <td>sit</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
});

var TestSection = React.createClass({
  displayName: 'Test Section',
  render(){
    return (
      <div>
        <h2 className="sub-header">Test Section</h2>
        <TestTable />
      </div>
    );
  }
});

Actions.register(TestSection, {role: 'dashboard-section'});

var DashboardLink = React.createClass({
  displayName: 'Test Page',
  containerRequired: false,
  render(){
    return <li><a href="/#/test">Test Primary Nav</a></li>
  }
});

Actions.register(DashboardLink, {role: 'primary-nav-action'});

var RemoteLink = React.createClass({
  displayName: 'Test Remote Page',
  containerRequired: false,
  render(){
    return <li><a href="/test.html">Test Local Page</a></li>
  }
});

Actions.register(RemoteLink, {role: 'primary-nav-action'});
