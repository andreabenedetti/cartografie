
let margin = 10,
width = 3000,
height = 2800;

let cartogramma = d3.select("#cartogramma")
.append("svg")
.attr("width", width)
.attr("height", height);

let projection = d3.geoConicEquidistant()
.fitSize([width, height], cartogramma)
.scale(700)
.translate([width / 2, height / 2]);

let size = d3.scaleSqrt()
.range([2,30]);

    // let color = d3.scaleSequential(d3.interpolateRdPu);
    let color = d3.scaleOrdinal()
    .domain(["Central Mediterranean","Western Mediterranean","Eastern Mediterranean","Italy to France","Western African","Western Balkans"])
    .range(["#885053","#FE5F55","#777DA7","#94C9A9","#C6ECAE","#453F3C"]);

    // let colorScale = d3.scaleSequential(d3.interpolateRdPu)
    let colorScale = d3.scaleLinear()
    .interpolate(d3.interpolateRgb)
    .range([d3.rgb("#59C9A5"), d3.rgb('#FF6F59')])
    .domain([0,100]);

    d3.tsv("migrants.tsv", function(error, data) {
    	if (error) throw error;

        let path = d3.geoPath().projection(projection);

        let url = "https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-50m.json";

        d3.json(url, function(error, world) {
          if (error) throw error;

          cartogramma.selectAll("path")
          .data(topojson.feature(world, world.objects.countries).features)
          .enter().append("path")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#d5d5d5");

      });

        size.domain(d3.extent(data, function(d) {
          return +d.deadmissing;
      }));

        color.domain(d3.extent(data, function(d) {
          return +d.year;
      }));

        let colorKey = cartogramma.append("g")
        .classed("legend", true)
        .attr("transform", "translate(" + ( margin * 4 ) + "," + ( height - 4 * margin ) + ")");

        colorKey.selectAll("legend")
        .data(d3.range(100), function(d) { return d; })
        .enter().append("rect")
        .classed(".scale", true)
        .attr("x", function(d, i) { return i; })
        .attr("y", 0)
        .attr("height", 10)
        .attr("width", 100)
        .style("fill", function(d, i ) { return colorScale(d); });

        colorKey.append("text")
        .text("Indice di vulnerabilità")
        .classed("label", true)
        .attr("x", 0)
        .attr("y", 25);

        console.log("inizio");
    	// console.log(JSON.stringify(data, null, "\t"));

    	let nodes = data
    	.map(d=> {
    		let point = projection([d.lon, d.lat]);
    		let value = +d.deadmissing;
    		return {
    			x: point[0], y: point[1],
    			x0: point[0], y0: point[1],
    			name: d.region,
                missing: d.missing,
                dead: d.dead,
                survivors: d.survivors,
                year: d.year,
                r: size(value),
                value: value,
                route: d.route
            };
        });



    	let extent = d3.extent(data, function(d) {
    		return +d.dmis;
    	});

    	extent = extent.map(d=> {
    		return {
    			dmis: d,
    			dead: null
    		};
    	});

    	let simulation = d3.forceSimulation()
    	.force("x", d3.forceX(function(d) { return d.x0;}))
    	.force("y", d3.forceY(function(d) { return d.y0; }))
    	// .force("collide", collide)
    	.nodes(nodes)
    	.on("tick", tick);

    	let node = cartogramma.selectAll(".rect")
    	.data(nodes)

    	let missingRect = node.enter()
    	.append("rect")
        .filter(d => { return d.year == 2018 })
        .classed("rect", true)
        .attr("width", 2)
        .attr("height", d=> { return size(d.missing)})
        .attr("fill", "orange");

        let survivorsRect = node.enter()
        .append("rect")
        .filter(d => { return d.year == 2018 })
        .classed("rect", true)
        .attr("width", 2)
        .attr("height", d=> { return size(d.survivors)})
        .attr("fill", "purple");

        // let label = cartogramma.selectAll(".label")
        // .data(nodes)
        // .enter()
        // .append("text")
        // .classed("label", true)
        // .text(d=> { 
        //     return d.year;
        // })
        // .style("text-anchor", "middle");

    // tick function
    function tick(e) {
    	survivorsRect.attr("x", function(d) { return d.x; })
    	.attr("y", function(d) { return d.y; });

        missingRect.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y + size(+d.survivors); });

    	// label.attr("x", function(d) { return d.x - ( d.r * 0.5 ); })
    	// .attr("y", function(d) { return d.y + 12; });
    }

	// anti-collision for rectangles by mike bostock
	function collide() {
		for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
			for (var i = 0, n = nodes.length; i < n; ++i) {
				for (var a = nodes[i], j = i + 1; j < n; ++j) {
					var b = nodes[j],
					x = a.x + a.vx - b.x - b.vx,
					y = a.y + a.vy - b.y - b.vy,
					lx = Math.abs(x),
					ly = Math.abs(y),
					r = a.r + b.r;
					if (lx < r && ly < r) {
						if (lx > ly) {
							lx = (lx - r) * (x < 0 ? -strength : strength);
							a.vx -= lx, b.vx += lx;
						} else {
							ly = (ly - r) * (y < 0 ? -strength : strength);
							a.vy -= ly, b.vy += ly;
						}
					}
				}
			}
		}
	}

});
