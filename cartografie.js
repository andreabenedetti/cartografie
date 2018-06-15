$( document ).ready(function() {

	let margin = 10,
	width = window.innerWidth,
	height = window.innerHeight * 0.9 - margin;

	let cartogramma = d3.select("#cartogramma")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.style("background", "rgba(0,0,0,.02");

	let projection = d3.geoMercator();

	let size = d3.scaleSqrt()
	.range([4,60]);

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

    let color = d3.scaleSequential(d3.interpolateWarm);

    d3.tsv("countries.tsv", function(error, data) {
    	if (error) throw error;

    	size.domain(d3.extent(data, function(d) {
    		return +d.funds;
    	}));

    	color.domain(d3.extent(data, function(d) {
    		return +d.vuln;
    	}));

    	projection.scale(190)
    	.translate([width / 2, height / 2]);

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

    	let extent = d3.extent(data, function(d) {
    		return +d.funds;
    	});

    	extent = extent.map(d=> {
    		return {
    			funds: d,
    			vuln: null
    		};
    	});

    	let simulation = d3.forceSimulation()
    	.force("x", d3.forceX(function(d) { return d.x0; }))
    	.force("y", d3.forceY(function(d) { return d.y0; }))
    	.force("collide", collide)
    	.nodes(nodes)
    	.on("tick", tick);

    	let node = cartogramma.selectAll(".rect")
    	.data(nodes)

    	let countryRect = node.enter()
    	.append("rect")
    	.classed("rect", true)
    	.attr("width", d=>{ 
    		return size(+d.funds);
    	})
    	.attr("height", d=>{ 
    		return size(+d.funds);
    	})
    	.attr("fill", d=> { return color(+d.vuln); })
    	.on("click", function(d) {
    		d3.selectAll("#tooltip p").remove();
    		d3.selectAll("#tooltip svg").remove();

    		d3.selectAll(".rect").style("opacity", 0.2);
    		d3.select(this).style("opacity", 1);

    		let glyph = d3.select("#tooltip").append("svg")
    		.attr("width", 62)
    		.attr("height", 62)

    		if (extent.length > 2) {
    			extent.shift();
    		}

    		extent.unshift({ funds: d.funds, vuln: d.vuln });

    		console.log(extent);

    		glyph.selectAll(".rect")
    		.data(extent)
    		.enter()
    		.append("rect")
    		.classed("rect", true)
    		.attr("width", function(f) { 
    			return size(f.funds);
    		})
    		.attr("height", function(f) { 
    			return size(f.funds);
    		})
    		.attr("fill", f => { 

    			if (f.vuln == null) {
    				return "none";
    			}else {
    				return color(+f.vuln);
    			}

    		})
    		.attr("stroke", f => {

    			if (f.vuln == null) {
    				return "black";
    			}else {
    				return "none";
    			}

    		})
    		.attr("x", 1)
    		.attr("y", 1);

    		d3.select("#tooltip").append("p")
    		.classed("escape", true)
    		.text("x")
    		.on("click", function(d) {
    			d3.selectAll(".rect").style("opacity", 1);
    			d3.selectAll("#tooltip p").remove();
    			d3.selectAll("#tooltip svg").remove();
    		});;

    		d3.select("#tooltip").append("p")
    		.classed("country", true)
    		.text(d.name);

    		d3.select("#tooltip").append("p")
    		.classed("funds", true)
    		.text(Math.ceil(d.funds) + " mil. di dollari");

    	});

    	let label = cartogramma.selectAll(".label")
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
    	.style("fill", "var(--dark)")
    	.style("font-size", "0.6rem");

    // tick function
    function tick(e) {
    	countryRect.attr("x", function(d) { return d.x - d.r; })
    	.attr("y", function(d) { return d.y - d.r; });

    	label.attr("x", function(d) { return d.x - ( d.r * 0.5 ); })
    	.attr("y", function(d) { return d.y + 12; });
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

});