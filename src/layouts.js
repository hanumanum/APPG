function showSankeyD3(data, containerSelector, conf) {
    $(containerSelector).empty();

    if (!data.length) {
        $(containerSelector).text("no data for current filters");
        return;
    }

    const MAGIC_FIX = 40
    const height = calcHeight(data, 1)
    const width = $(containerSelector).width() - MAGIC_FIX
    const graph = formatForSankey(data)

    const margin = { top: 30, right: 10, bottom: 10, left: 10 }

    const svg = d3.select(containerSelector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const defs = svg.append('defs');
    const color = d3.scaleOrdinal(scaleByAni());
    const sankey = d3.sankey()
        .nodeWidth(conf.nodeWidth)
        .nodePadding(conf.nodePadding)
        .size([width, height]);

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1);

    const link = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", sankey.link())
        .style("stroke-width", function (d) { return Math.max(1, d.dy); })
        .attr("id", function (d) { return "link_" + d.number })
        .sort(function (a, b) { return b.dy - a.dy; })


    link.on("mouseenter", onEnterShowText)
    link.on("mouseleave", onLeaveShowText)

    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .attr("pointer-events", "all")
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })


    node
        .append("rect")
        .attr("height", function (d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function (d) { return d.color = color(d.name.replace(/ .*/, "")); })
    //.style("stroke", function (d) { return d3.rgb(d.color).darker(2); })
    //.append("title")
    //.text(function (d) { return d.name + "\n" + "Total: " + "£" + d3.format(",.2r")(d.value); });

    node
        .append("text")
        .attr("x", + 20) //For destinations
        .attr("y", -6)
        .attr("text-anchor", "end")
        .text(function (d) { return d.name + " £" + d3.format(",.2r")(d.value); })
        .filter(function (d) { return d.x < width / 2; })
        .attr("x", sankey.nodeWidth() - 20) //For Sources 
        .attr("text-anchor", "start");


    link.style('stroke', function (d, i) {
        const gradientID = `gradient${i}`;
        const startColor = d.source.color;
        const stopColor = d.target.color;

        const linearGradient = defs.append('linearGradient')
            .attr('id', gradientID);

        linearGradient.selectAll('stop')
            .data([
                { offset: '10%', color: startColor },
                { offset: '90%', color: stopColor }
            ])
            .enter().append('stop')
            .attr('offset', d => {
                return d.offset;
            })
            .attr('stop-color', d => {
                return d.color;
            });

        return `url(#${gradientID})`;
    })

}



function showTableD3(data, containerSelector, conf) {
    $(containerSelector).empty();

    if (!data.length) {
        $(containerSelector).text("no data for current filters");
        return;
    }

    const b = datarepo.groupByAPPG(data)
    console.log(b)

    const table = d3.select(containerSelector)
    table.selectAll("tr")
    //table.data(graph.links)
    
    /*
    const MAGIC_FIX = 40
    const height = calcHeight(data, 1)
    const width = $(containerSelector).width() - MAGIC_FIX
    const graph = formatForSankey(data)

    const margin = { top: 30, right: 10, bottom: 10, left: 10 }

    const svg = d3.select(containerSelector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const defs = svg.append('defs');
    const color = d3.scaleOrdinal(scaleByAni());
    const sankey = d3.sankey()
        .nodeWidth(conf.nodeWidth)
        .nodePadding(conf.nodePadding)
        .size([width, height]);

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1);

    const link = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", sankey.link())
        .style("stroke-width", function (d) { return Math.max(1, d.dy); })
        .attr("id", function (d) { return "link_" + d.number })
        .sort(function (a, b) { return b.dy - a.dy; })


    link.on("mouseenter", onEnterShowText)
    link.on("mouseleave", onLeaveShowText)

    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .attr("pointer-events", "all")
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })


    node
        .append("rect")
        .attr("height", function (d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function (d) { return d.color = color(d.name.replace(/ .*\/, "")); })
    

    node
        .append("text")
        .attr("x", + 20) //For destinations
        .attr("y", -6)
        .attr("text-anchor", "end")
        .text(function (d) { return d.name + " £" + d3.format(",.2r")(d.value); })
        .filter(function (d) { return d.x < width / 2; })
        .attr("x", sankey.nodeWidth() - 20) //For Sources 
        .attr("text-anchor", "start");


    link.style('stroke', function (d, i) {
        const gradientID = `gradient${i}`;
        const startColor = d.source.color;
        const stopColor = d.target.color;

        const linearGradient = defs.append('linearGradient')
            .attr('id', gradientID);

        linearGradient.selectAll('stop')
            .data([
                { offset: '10%', color: startColor },
                { offset: '90%', color: stopColor }
            ])
            .enter().append('stop')
            .attr('offset', d => {
                return d.offset;
            })
            .attr('stop-color', d => {
                return d.color;
            });

        return `url(#${gradientID})`;
    })
    */
}