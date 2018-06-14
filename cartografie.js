let margin = 10,
w = window.innerWidth - margin,
h = window.innerHeight * 0.9 - margin;

let cartogramma = d3.selectAll("#cartogramma")
.append("svg")
.attrs({
	width: w,
	height: h
})

let projection = d3.geoMercator();
let path = d3.geoPath()
.projection(projection);

let size = d3.scaleLinear()
.range([3,60]);

let interpolators = [
    // These are from d3-scale.
    "Viridis",
    "Inferno",
    "Magma",
    "Plasma",
    "Warm",
    "Cool",
    "Rainbow",
    "CubehelixDefault",
    // These are from d3-scale-chromatic
    "Blues",
    "Greens",
    "Greys",
    "Oranges",
    "Purples",
    "Reds",
    "BuGn",
    "BuPu",
    "GnBu",
    "OrRd",
    "PuBuGn",
    "PuBu",
    "PuRd",
    "RdPu",
    "YlGnBu",
    "YlGn",
    "YlOrBr",
    "YlOrRd"
    ];

let color = d3.scaleSequential(d3.interpolateRdPu);

d3.tsv("countries.tsv", function(error, data) {
	if (error) throw error;

	size.domain(d3.extent(data, function(d) {
        return +d.funds;
      }));

	color.domain(d3.extent(data, function(d) {
        return +d.vuln;
      }));

	projection.scale(180)
	.translate([w / 2, h / 2]);

	console.log("inizio");
	// console.log(JSON.stringify(data, null, "\t"));

	let nodes = data
	.map(d=> {
		let point = projection([d.lon, d.lat]);
		let value = +d.funds;
		return {
			x: point[0], y: point[1],
			x0: point[0], y0: point[1],
			id: d.id,
			name: d.country,
			funds: d.funds,
			vuln: d.vuln,
			r: size(value),
			value: value
		};
	});

	let simulation = d3.forceSimulation()
	.force("x", d3.forceX(function(d) { return d.x0; }))
	.force("y", d3.forceY(function(d) { return d.y0; }))
	// .force("collide", d3.forceCollide( d=> { return size(+d.funds) } ))
	.force("collide", collide)
	.nodes(nodes)
	.on("tick", tick);

	let node = cartogramma.selectAll("rect")
	.data(nodes)
	.enter().append("rect")
	.classed("rect", true)
	.attr("width", d=>{ 
		return size(+d.funds);
	})
	.attr("height", d=>{ 
		return size(+d.funds);
	})
	.attr("fill", d=> { return color(+d.vuln); })
	.attr("stroke", "#0A0101")
	.attr("stroke-width", 0.7)
	.on("mouseover", d => {
		
		d3.select("#tooltip").append("p")
		.classed("country", true)
		.text(d.name);

		d3.select("#tooltip").append("p")
		.classed("funds", true)
		.text(Math.round(d.funds) + " milioni di dollari");

		d3.select("#tooltip").append("p")
		.classed("vuln", true)
		.text("vuln. index: " + d.vuln);

	})
	.on("mouseleave", d => {
		d3.selectAll("#tooltip p").remove()
	});

	let label = cartogramma.selectAll(null)
    .data(nodes)
    .enter()
    .append("text")
    .classed("label", true)
    .text(d=> { 
    	if(d.funds == 0) {
    		return " ";
    	} else {
    		return d.id;
    	}
    })
    .style("text-anchor", "middle")
    .style("fill", "#0A0101")
    .style("font-family", "Arimo")
    .style("font-size", 10);

	function tick(e) {
		node.attr("x", function(d) { return d.x - d.r; })
			.attr("y", function(d) { return d.y - d.r; });

		label.attr("x", function(d) { return d.x - ( d.r / 2 ); })
    		.attr("y", function(d) { return d.y + 12; });
	}

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