var PieChart = D3RRC.PieChart;

var Page = React.createClass({
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

window.D3RRCPage = Page;
