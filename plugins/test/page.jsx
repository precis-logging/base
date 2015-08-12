var addCommas=(x)=>{
  var parts = (x||'').toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

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

var Test = React.createClass({
  getInitialState(){
    return {
      value: 'Waiting'
    };
  },
  updateState(TestStore){
    var records = TestStore.items();
    this.setState({
      value: TestStore.latest(),
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

    var latest = this.refs.latest.getDOMNode();
    latest.innerText = 'This\n  is\n    a\n  test';
    setTimeout(function(){
      latest.innerText = 'This\n  is\n    only\n  a\ntest';
    }, 1000);
  },
  componentWillUnmount(){
    this.unlisten&&this.unlisten();
  },
  render(){
    return(
      <div>
        <h1>Hello World</h1>
        <span>Counter: {addCommas(this.state.value)}</span>
        <pre ref="latest"></pre>
        <TestTable records={this.state.records}/>
      </div>
    );
  }
});

window.Test = Test;
