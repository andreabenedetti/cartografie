size.domain(d3.extent(data, function(d) {
          return +d.deadmissing;
      }));

        color.domain(d3.extent(data, function(d) {
          return +d.year;
      }));

        console.log("inizio");
    	// console.log(JSON.stringify(data, null, "\t"));

    	let nodes = data
    	.map(d=> {
    		let point = projection([d.lon, d.lat]);
    		let value = +d.survivors;
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
    	.force("cx", d3.forceX(function(d) { return d.x0;}))
    	.force("cy", d3.forceY(function(d) { return d.y0; }))
    	// .force("collide", d3.forceCollide(2)
     //    .iterations(10))
     //    .alphaDecay(0)
     //    .alpha(0.5)
    	.nodes(nodes)
    	.on("tick", tick);

    	let node = cartogramma.selectAll(".circle")
    	.data(nodes) 

    	let missingDot = node.enter()
    	.append("circle")
        .filter(d=> { return d.year == 2018})
        // .filter(d => { return d.route === "Eastern Mediterranean" || d.route === "Central Mediterranean" || d.route === "Western Mediterranean" })
        .classed("circle", true)
        .attr("r", 1.5)
        .attr("fill", "black");

        // let survivorsRect = node.enter()
        // .append("rect")
        // // .filter(d => { return d.route !== "Horn Africa to Yemen" })
        // .classed("rect", true)
        // .attr("width", 2)
        // .attr("height", d=> { return size(d.survivors)})
        // .attr("fill", "purple");

        // let label = cartogramma.selectAll(".label")
        // .data(nodes)
        // .enter()
        // .append("text")
        // .classed("label", true)
        // .text(d=> { 
        //     return d.route;
        // })
        // .style("text-anchor", "middle");

    // tick function
    function tick(e) {
    	// survivorsRect.attr("x", function(d) { return d.x; })
    	// .attr("y", function(d) { return d.y; });

        missingDot.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y + size(+d.survivors); });

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