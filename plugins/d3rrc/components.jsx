var PieChart = D3RRC.PieChart;

var Widget = React.createClass({
  displayName: 'D3RRC Pie Widget',
  componentDidMount(){
    /*
    var container = this.refs.chart.getDOMNode();
    var data = [
      {
        key: 'Raawr',
        value: '2704659',
      },
      {
        key: 'Squeek',
        value: '4499890',
      },
      {
        key: 'Boom',
        value: '2159981',
      },
    ];
    var width = Math.min(800, container.clientWidth),
        height = width * 0.75,
        radius = Math.min(width, height) / 2;

    var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.value; });

    var svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      data.forEach(function(d) {
        d.value = +d.value;
      });

      var g = svg.selectAll(".arc")
          .data(pie(data))
        .enter().append("g")
          .attr("class", "arc");

      g.append("path")
          .attr("d", arc)
          .style("fill", function(d) { return color(d.data.key); });

      g.append("text")
          .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
          .attr("dy", ".35em")
          .style("text-anchor", "middle")
          .text(function(d) { return d.data.key; });
    //*/
  },
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
      <div>
        <div>
          <PieChart
            chart-height="210"
            chart-width="200"
            chart-innerRadius="0"
            chart-margin={{top: 1, left: 1, bottom: 1, right: 1}}
            chart-colorRange={colorRange}
            data={data}
            />
        </div>
        <h4>D3RRC Pie Chart</h4>
        <span className="text-muted">This is a Pie Chart</span>
      </div>
    );
  }
});

Actions.register(Widget, {role: 'dashboard-widget'});
