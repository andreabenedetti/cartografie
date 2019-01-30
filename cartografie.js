
let margin = 10,
width = window.innerWidth,
height = window.innerHeight - margin;

let cartogramma = d3.select("#cartogramma")
.append("svg")
.attr("width", width)
.attr("height", height)
.style("background", "#e5e1e1");

let projection = d3.geoMercator()
.fitSize([width, height], cartogramma);

let size = d3.scaleSqrt()
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

    // let color = d3.scaleSequential(d3.interpolateRdPu);
    let color = d3.scaleLinear()
    .interpolate(d3.interpolateRgb)
    // .range([d3.rgb("#59c9a5"), d3.rgb('#FF495D')])
    .range([d3.rgb("#59C9A5"), d3.rgb('#FF6F59')])
    .domain([0,100]);

    // let colorScale = d3.scaleSequential(d3.interpolateRdPu)
    let colorScale = d3.scaleLinear()
    .interpolate(d3.interpolateRgb)
    .range([d3.rgb("#59C9A5"), d3.rgb('#FF6F59')])
    .domain([0,100]);

    d3.tsv("migrants.tsv", function(error, data) {
    	if (error) throw error;

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


        projection.scale(190)
        .translate([width / 2, height / 2]);

        console.log("inizio");
    	// console.log(JSON.stringify(data, null, "\t"));

    	let nodes = data
    	.map(d=> {
    		let point = projection([d.lat, d.lon]);
    		let value = +d.deadmissing;
    		return {
    			x: point[0], y: point[1],
    			x0: point[0], y0: point[1],
    			name: d.region,
    			dmis: d.deadmissing,
    			dead: d.dead,
    			r: size(value),
    			value: value
    		};
    	});



    	let extent = d3.extent(data, function(d) {
    		return +d.deadmissing;
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
    	.force("collide", collide)
    	.nodes(nodes)
    	.on("tick", tick);

    	let node = cartogramma.selectAll(".rect")
    	.data(nodes)

    	let countryRect = node.enter()
    	.append("rect")
        // .filter(d => { return filtered })
        .classed("rect", true)
        .attr("width", 3)
        .attr("height", 3)
        .attr("fill", d=> { return color(+d.vuln); });

        let label = cartogramma.selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .classed("label", true)
        .text(d=> { 
            return d.year;
        })
        .style("text-anchor", "middle");

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
