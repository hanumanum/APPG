function distinct(value, index, self) {
    return self.indexOf(value) === index
}

function UserException(message, data) {
    this.message = message;
    this.name = 'UserException';
    console.error(data)
}

function concatDistinct(arr1, arr2) {
    if (arr1 == undefined) {
        arr1 = []
    }

    if (arr2 == undefined) {
        arr2 = []
    }
    return [...new Set([...arr1, ...arr2])];
}

function calcHeight(data, ratio) {
    return 900

    if (data.length < 30) return 650
    return data.reduce(function (accumulator, currentValue) {
        return accumulator + currentValue.total / data.length
    }, 0) * ratio
}

function extractNodesBy(data, keyname) {
    return data.map(function (d) { return d[keyname] }).filter(distinct).sort()
}


function formatForSankey(data) {
    const sankeyData = {
        nodes: []  //array of {name:value}
        , links: []  //array of {source:value, target:value, value:value}
    }

    const allNodes = extractNodesBy(data, "source").concat(extractNodesBy(data, "appg"))
    sankeyData.nodes = allNodes.map(function (d, i) {
        return {
            node: i,
            name: d
        }
    })

    sankeyData.links = data.map(function (d) {
        return {
            source: allNodes.indexOf(d.source),
            target: allNodes.indexOf(d.appg),
            value: d.total,
            date: d.date,
            number: d.number
        }
    })

    sankeyData.links.sort(function (a, b) { return a.date - b.date })
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


function initTypeHead(selector, onOptionSelected, optionsArray) {
    const conf = {
        highlight: true,
        minLength: 0,
        hint: true
    }

    function createOptionsFonfig(options) {
        return {
            name: options.title,
            source: substringMatcher(options.data),
            limit: options.data.length,
            templates: {
                header: '<h3>' + options.title + '</h3>'
            }
        }
    }

    const optionsConfigsArray = optionsArray.map(function(cv){
        return createOptionsFonfig(cv);
    })

    $(selector).typeahead(conf, ...optionsConfigsArray)
                .bind("typeahead:select", onOptionSelected)
                .bind("keyup", onOptionCleared)

    fixListsWidth()
}

function fixListsWidth(){
    fixSearchLitWidth("#search_destinations", ".tt-dataset-APPG, .tt-dataset-MP, .tt-dataset-Sources")
    fixSearchLitWidth("#search_years", ".tt-dataset-Year")
}

function fixSearchLitWidth(widthFromSelector, widthToSelector) {
    setTimeout(function () {
        const searchInput = $(widthFromSelector);
        $(widthToSelector).css("width", $(searchInput).css("width"))
    })
}

function distinctMetaInfo(data) {
    return data.reduce(function (accumulator, currentValue) {
        const first = accumulator[currentValue.appg]
        const second = currentValue.mps
        accumulator[currentValue.appg] = concatDistinct(first, second)
        return accumulator
    }, {})
}

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

    const margin = { top: 10, right: 10, bottom: 10, left: 10 }

    const svg = d3.select(containerSelector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const defs = svg.append('defs');
    const color = d3.scaleOrdinal(d3.schemeCategory10);
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


    svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("text")
        .text(function (d) { return d.date + " - £" + d3.format(",.2r")(d.value); })
        .attr("x", function (d) { return d.source.x + (d.target.x - d.source.x) / 2; })
        .attr("y", function (d) { return d.source.y + d.sy + d.dy / 1.5 })
        .attr("id", function (d) { return "link_text_" + d.number })
        .style("display", "none")

    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
        .call(d3.drag()
            .subject(function (d) { return d; })
            .on("start", function () { this.parentNode.appendChild(this); })/*.on("drag", dragmove)*/);

    node
        .append("rect")
        .attr("height", function (d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function (d) { return d.color = color(d.name.replace(/ .*/, "")); })
        .style("stroke", function (d) { return d3.rgb(d.color).darker(2); })
        .append("title")
        .text(function (d) { return d.name + "\n" + "Total: " + "£" + d3.format(",.2r")(d.value); });

    node
        .append("text")
        .attr("x", -6)
        .attr("y", function (d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) { return d.name + " £" + d3.format(",.2r")(d.value); })
        .filter(function (d) { return d.x < width / 2; })
        .attr("x", 6 + sankey.nodeWidth())
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

function onOptionCleared(ev) {
    if (ev.target.value == "") {
        if (ev.target.id == "search_destinations") {
            datarepo.removeFilter("text") 
        }

        $(ev.target).trigger("typeahead:select")
    }

}

function onYearSelected(ev, suggestion) {
    datarepo.addFilter("year", suggestion)
    const filtered = datarepo.getFiltered()
    showSankeyD3(filtered, "#sankey", { nodeWidth, nodePadding })
    showMPtoAPPGRelations(suggestion)
}


function onOptionSelected(ev, suggestion) {
    datarepo.addFilter("text", suggestion)
    const filtered = datarepo.getFiltered()
    showSankeyD3(filtered, "#sankey", { nodeWidth, nodePadding })
    showMPtoAPPGRelations(suggestion)
}


function onEnterShowText(d) {
    const textID = "link_text_" + d.number
    $('#' + textID).css("display", "initial")
}

function onLeaveShowText(d) {
    const textID = "link_text_" + d.number
    $('#' + textID).css("display", "none")
}

function getMPtoAPPGRelations(mpname) {
    function filter(a) {
        return a.mps.includes(mpname)
    }

    function reducerAppg(accumulator, currentValue) {
        accumulator.push(currentValue.appg)
        return accumulator;
    }

    function reducerYear(accumulator, currentValue) {
        accumulator.push(currentValue.date)
        return accumulator;
    }

    const mpData = data.filter(filter)
    const overview = {
        appgs: mpData.reduce(reducerAppg, []).filter(distinct),
        years: mpData.reduce(reducerYear, []).filter(distinct)
    }

    overview.appgCount = overview.appgs.length
    overview.yearMin = Math.min(...overview.years)
    overview.yearMax = Math.max(...overview.years)
    overview.name = mpname

    return overview
}


function showMPtoAPPGRelations(mpname) {
    $("#mpoverview").empty()
    
    const info = getMPtoAPPGRelations(mpname)
    if (!info.appgCount)
        return

    const str = `${info.name} is a member of ${info.appgCount} All-Party Parliamentary Group${(info.appgCount!=1)?"s":""} that received funding in ${info.yearMin}-${info.yearMax}.`;
    $("#mpoverview").html(str)
}


