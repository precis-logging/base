var PieChart = D3RRC.PieChart;
var VBarChart = D3RRC.VBarChart;

var Pie = React.createClass({
  render(){
    var data = (function(size){
      var data = [];
      var i=0, l=size;
      for(; i<l; i++){
        data.push({
          value: Math.floor(Math.random() * 90)+10,
          text: "Test "+i
        });
      }
      return data;
    })(10);
    var colorRange = d3.scale.linear()
          .domain([0, 50, 100])
          .range(["red", "green", "blue"]);

    return (
      <PieChart
        chart-innerRadius="0"
        chart-colorRange={colorRange}
        data={data}
        />
    );
  }
});

var VBar = React.createClass({
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
          value: Math.floor(Math.random() * 90)-40,
          text: "Test "+i
        });
      }
      return data;
    })(10);
    var styles={
      'rect.positive': 'fill: steelblue;',
      'rect.negative': 'fill: brown;',
    };
    return (
      <VBarChart
        chart-height="320"
        chart-names={names}
        chart-values={values}
        chart-style={styles}
        data={data}
        />
    );
  }
});

var Page = React.createClass({
  render(){
    return (
      <div>
        <VBar />
        <Pie />
      </div>
    );
  }
});

Pages.register('D3RRCPage', Page);
