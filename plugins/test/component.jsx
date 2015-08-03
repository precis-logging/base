var TestComponent = React.createClass({
  displayName: 'Test Component',
  render(){
    return <h2>This is a basic test component</h2>
  }
});

Actions.register(TestComponent, {role: 'test-component'});
