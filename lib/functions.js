function distinct(value, index, self) {
    return self.indexOf(value) === index
}

function getSuggestionList(data, keyname) {
    return data.map(function (d) { return d[keyname] }).filter(distinct).sort()
}

function getMPsList(data) {
    return data.reduce(function (accumulator, currentValue) {
        return accumulator.concat(currentValue.mps)
    }, []).filter(distinct).sort()
}

function filterBy(data, key, value) {
    return data.filter(function (v) {
        return v[key] === value
    })
}

function filterByMP(data, name) {
    return data.filter(function (v) {
        return v.mps.includes(name)
    })
}

function filterByFilter(data, filter){
    if(filter.source==undefined && filter.target==undefined){
        return data;
    }

    const _data = data.filter(function(v){
        return (v.source == filter.source ||  v.appg == filter.target)
    })
    
    return _data;

}

function calcHeight(data, ratio){
    if(data.length < 10) return 650
    
    const heigth = data.reduce(function(accumulator, currentValue){
        return accumulator+currentValue.total/data.length
    },0)

    return heigth*ratio
}

function formatForSankey(data){
    const sankeyData = {
         nodes:[]  //array of {name:value}
        ,links:[]  //array of {source:value, target:value, value:value}

    }

    const allNodes = getSuggestionList(data, "source").concat(getSuggestionList(data, "appg"))
    sankeyData.nodes = allNodes.map(function(d,i){
        return {
            node:i,
            name:d
        }
    })

    sankeyData.links = data.map(function(d){
        return {
            source:allNodes.indexOf(d.source),
            target:allNodes.indexOf(d.appg),
            value:d.total
        }
    })
    return sankeyData;
}


function substringMatcher(strs) {
    return function findMatches(q, cb) {
        const substrRegex = new RegExp(q, 'i');
        const matches = strs.filter(function (v) {
            return substrRegex.test(v);
        })

        cb(matches);
    };
};


function initTypeHead(selector, onOptionSelected, options1, options2 = null) {
    function createOptionsFonfig(options){
        return {
            name: options.title,
            source: substringMatcher(options.data),
            limit:options.data.length,
            templates: {
                header: '<h3>' + options.title + '</h3>'
            }
        }
    }

    const opt1 = createOptionsFonfig(options1);
    const conf = {
        highlight: true,
        minLength: 0,
        hint:true
    }

    if(options2){
        const opt2 = createOptionsFonfig(options2);
        $(selector).typeahead(conf, opt1, opt2);
    }
    else{
        $(selector).typeahead(conf, opt1);
    }

    $(selector).bind("typeahead:select", onOptionSelected)
    $(selector).bind("keyup", onOptionCleared)

}

function onOptionCleared(ev){
    if(ev.target.value==""){
        if(ev.target.id=="search_sources"){
            filterObject.source=undefined
        }

        if(ev.target.id=="search_destinations"){
            filterObject.target=undefined
        }

        $(ev.target).trigger("typeahead:select")
    }

}

function onOptionSelected(ev, suggestion){
    if(ev.target.id=="search_sources"){
        filterObject.source = suggestion
    }
    
    if(ev.target.id=="search_destinations"){
        filterObject.target = suggestion
    }

    const _data = filterByFilter(data, filterObject)
    showSankeyD3(_data, "#sankey", { nodeWidth, nodePadding })
    
}

function UserException(message, data) {
    this.message = message;
    this.name = 'UserException';
    console.error(data)
}

function checkData(data){
    const same = data.filter(function(d){
        return d.appg === d.source
    })

    if(same.length) throw new UserException('appg and source can`t be same', same);
}


function showSankeyD3(data, containerSelector, conf) {
    $(containerSelector).empty();
    const height = calcHeight(data, 1)
    const width = $(containerSelector).width();
    const graph = formatForSankey(data)

    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
        //width = conf.width//, 800,
        //height = conf.height //600

    // append the svg object to the body of the page
    const svg = d3.select(containerSelector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Color scale used
    const color = d3.scaleOrdinal(d3.schemeCategory20);

    // Set the sankey diagram properties
    const sankey = d3.sankey()
        .nodeWidth(conf.nodeWidth)
        .nodePadding(conf.nodePadding)
        .size([width, height]);


    // Constructs a new Sankey generator with the default settings.
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(1);


    // add in the links
    const link = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", sankey.link())
        .style("stroke-width", function (d) { return Math.max(1, d.dy); })
        .sort(function (a, b) { return b.dy - a.dy; })

    // add in the links
    const linkTexts = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("text")
        .text(function (d) { return "£" + d3.format(",.2r")(d.value);  })
        .attr("x", function (d) { return d.source.x + (d.target.x - d.source.x) / 2; })
        .attr("y", function (d) { return d.source.y+d.sy +d.dy/1.5 })

    // add in the nodes
    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
        .call(d3.drag()
            .subject(function (d) { return d; })
            .on("start", function () { this.parentNode.appendChild(this); }));
            //.on("drag", dragmove));

    // add the rectangles for the nodes
    node
        .append("rect")
        .attr("height", function (d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function (d) { return d.color = color(d.name.replace(/ .*/, "")); })
        .style("stroke", function (d) { return d3.rgb(d.color).darker(2); })
        // Add hover text
        .append("title")
        .text(function (d) { return d.name + "\n" + "Total`" + d.value; });

    // add in the title for the nodes
    node
        .append("text")
        .attr("x", -6)
        .attr("y", function (d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) { return d.name; })
        .filter(function (d) { return d.x < width / 2; })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    // the function for moving the nodes
    /*
    function dragmove(d) {
        d3.select(this)
            .attr("transform",
                "translate("
                + d.x + ","
                + (d.y = Math.max(
                    0, Math.min(height - d.dy, d3.event.y))
                ) + ")");
        sankey.relayout();
        link.attr("d", sankey.link());
    }
    */



}