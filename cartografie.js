
let margin = 10,
width = window.innerWidth,
height = 2800;

let cartogramma = d3.select("#cartogramma")
.append("svg")
.attr("width", width)
.attr("height", height);


let mappa = cartogramma.append("g");
let contourArea = cartogramma.append("g");
let contourLine = cartogramma.append("g");
let confini = cartogramma.append("g");
let route = cartogramma.append("g");
let cities = cartogramma.append("g");

let projection = d3.geoConicEquidistant()
.fitSize([width, height], cartogramma)
.scale(1600)
.translate([width / 2 - 320, height / 2]);

let size = d3.scaleLinear()
.range([10,100]);

    // let colorScale = d3.scaleSequential(d3.interpolateRdPu)
    let color = d3.scalePow()
    .exponent(.4)
    .domain([0,1])
    .interpolate(d3.interpolateHsl)
    .range([d3.hsl("#eebb88"), d3.hsl("#FFFFFF")]);

    d3.tsv("migrants.tsv", function(error, data) {
    	if (error) throw error;

        size.domain(d3.extent(data, function(d) {
          return +d.deadmissing;
      }));

        let defs = cartogramma.append("defs");

        let filter = defs.append("filter")
        .attr("id", "dropshadow")

        filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 2)
        .attr("result", "blur");
        filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 5)
        .attr("dy", 5)
        .attr("result", "offsetBlur")
        filter.append("feFlood")
        .attr("in", "offsetBlur")
        .attr("flood-color", "#3d3d3d")
        .attr("flood-opacity", "0.1")
        .attr("result", "offsetColor");
        filter.append("feComposite")
        .attr("in", "offsetColor")
        .attr("in2", "offsetBlur")
        .attr("operator", "in")
        .attr("result", "offsetBlur");

        var feMerge = filter.append("feMerge");

        feMerge.append("feMergeNode")
        .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");


        let dataFiltered = data.filter(d=> { return d.year == 2015 } );

        console.log(dataFiltered)

        let densityData = d3.contourDensity()
        .x(function(d) { return projection([d.lon, d.lat])[0]; })
        .y(function(d) { return projection([d.lon, d.lat])[1]; })
        .size([width, height])
        .weight(d=> { return size(d.deadmissing) } ) 
        .thresholds(27)
        .bandwidth(8)
        (dataFiltered)

        contourArea.selectAll("path")
        .data(densityData)
        .enter().append("path")
        .attr("d", d3.geoPath())
        .attr("fill", d=> { return color(d.value); })
        .attr("filter", "url(#dropshadow)");

        contourLine.selectAll("path")
        .data(densityData)
        .enter().append("path")
        .attr("d", d3.geoPath())
        .attr("fill", "none")
        .attr("stroke", "brown")
        .attr("stroke-width", .5)
        .attr("stroke-dasharray", "1 3");

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
        .filter(d=> { return d.year == 2015 })
        .classed("circle", true)
        .attr("r", 1.5)
        .attr("fill", "black");

        function tick(e) {
        missingDot.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y + size(+d.survivors); });
    }

    });


    let path = d3.geoPath().projection(projection);

    let url = "https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-50m.json";

    d3.json(url, function(error, world) {
      if (error) throw error;

      mappa.selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", "#aaaa88")

      confini.selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", .5)

  });

    d3.tsv("route-west-2.tsv", function(error, data) {
        if (error) throw error;

        let line = d3.line()
        .x(function(d) { return projection([d.lon, d.lat])[0]; })  
        .y(function(d) { return projection([d.lon, d.lat])[1]; })
        .curve(d3.curveLinear);

        route.append("path")
        .data([data])
        .attr("d", line)
        // .attr("d", line(data))
        .attr("fill", "none")
        .attr("stroke", "blue");

    });

    d3.tsv("line.tsv", function(error, data) {
        if (error) throw error;

        cities.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d=> { return projection([d.lon, d.lat])[0]; })
        .attr("cy", d=> { return projection([d.lon, d.lat])[1]; })
        .attr("r", 3)
        .attr("fill", "blue")

        cities.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", d=> { return projection([d.lon, d.lat])[0]; })
        .attr("y", d=> { return projection([d.lon, d.lat])[1] + 5; })
        .text(d=> { return d.city; })
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("alignment-baseline", "hanging")
        .classed("label", true)

    });
