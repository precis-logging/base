var Test = React.createClass({
  componentDidMount(){
    var latest = this.refs.latest.getDOMNode();
    latest.innerText = 'This\n  is\n    a\n  test';
    setTimeout(function(){
      latest.innerText = 'This\n  is\n    only\n  a\ntest';
    }, 1000);
  },
  render(){
    return(
      <div>
        <h1>Hello World</h1>
        <pre ref="latest"></pre>
      </div>
    );
  }
});

window.Test = Test;
