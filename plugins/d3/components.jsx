var D3PieWidget = React.createClass({
  displayName: 'Pie Widget',
  componentDidMount(){
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
  },
  render(){
    return (
      <div>
        <div ref="chart" />
        <h4>D3 Pie Chart</h4>
        <span className="text-muted">This is a Pie Chart</span>
      </div>
    );
  }
});

Actions.register(D3PieWidget, {role: 'dashboard-widget'});
