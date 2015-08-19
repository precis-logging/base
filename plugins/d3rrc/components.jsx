var BarChart = D3RRC.VBarChart;

var Widget = React.createClass({
  displayName: 'D3RRC Bar Chart Widget',
  render(){
    var names = function(d){
        return d.text;
      };
    var values = function(d){
        return d.value||0;
      };
    var data = (function(size){
      var data = [];
      var i=0, l=size;
      for(; i<l; i++){
        data.push({
          value: Math.floor(Math.random() * 30)+10,
          text: "Test "+i
        });
      }
      return data;
    })(5);
    return (
      <div>
        <BarChart
          chart-width="200"
          chart-height="210"
          chart-names={names}
          chart-values={values}
          data={data}
          />
        <h4>D3RRC Bar Chart</h4>
        <span className="text-muted">This is a Bar Chart</span>
      </div>
    );
  }
});

Actions.register(Widget, {role: 'dashboard-widget'});
