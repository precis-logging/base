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
    var recs = (this.props.records||[]);
    var len = recs.length;
    var records = recs.reverse().map((item, index)=>{
      return (
        <tr key={index}>
          <td>{len-index}</td>
          <td>{item.event}</td>
          <td>{item.counter}</td>
        </tr>
      );
    });
    return (
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Event</th>
              <th>Counter</th>
            </tr>
          </thead>
          <tbody>
            {records}
          </tbody>
        </table>
      </div>
    );
  }
});

var TestSection = React.createClass({
  displayName: 'Test Section',
  getInitialState(){
    return {
      records: []
    };
  },
  updateState(TestStore){
    var records = TestStore.items();
    this.setState({
      records: records.slice(Math.max(records.length-10, 0)),
    });
  },
  componentDidMount(){
    DataStore.getStore('TestStore', function(err, TestStore){
      if(err){
        alert(err);
        return console.error(err);
      }
      this.unlisten = TestStore.listen(()=>this.updateState(TestStore));
      this.updateState(TestStore);
    }.bind(this));
  },
  componentWillUnmount(){
    this.unlisten&&this.unlisten();
  },
  render(){
    return (
      <div>
        <h2 className="sub-header">Test Section</h2>
        <TestTable records={this.state.records} />
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
