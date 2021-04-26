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

    const optionsConfigsArray = optionsArray.map(function (cv) {
        return createOptionsFonfig(cv);
    })

    $(selector).typeahead(conf, ...optionsConfigsArray)
        .bind("typeahead:select", onOptionSelected)
        .bind("keyup", onOptionCleared)

    fixListsWidth()
}

function fixListsWidth() {
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


    svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("text")
        .text(function (d) { return d.date + " - £" + d3.format(",.2r")(d.value); })
        .attr("x", function (d) { return d.source.x + (d.target.x - d.source.x) / 2; })
        //.attr("y", function (d) { console.log(sankey.linkCoords()); return d.source.y + d.sy + d.dy / 1.5 })
        .attr("y", function (d) {
            const X = d.source.x + (d.target.x - d.source.x) / 2
            const Ys = calcBezierCurvePseudoCenterByX(d, X)
            console.log({ Ys })
            return Ys[1]
        })
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

    const str = `${info.name} is a member of ${info.appgCount} All-Party Parliamentary Group${(info.appgCount != 1) ? "s" : ""} that received funding in ${info.yearMin}-${info.yearMax}.`;
    $("#mpoverview").html(str)
}

function calcBezierCurvePseudoCenterByX(d, X) {
    /* https://learn.javascript.ru/bezier-curve
        x = (1−t)2x1 + 2(1−t)tx2 + t2x3
        y = (1−t)2y1 + 2(1−t)ty2 + t2y3
    */
    const x1 = d.c.x1
    const y1 = d.c.y1
    const x2 = d.c.x2
    const y2 = d.c.y2
    const x3 = d.c.x3
    const y3 = d.c.y3

    const a = (1 - 2 * x2 + x3)
    const b = 2 * (x2 - x1)
    const c = x1 - X
    let t1, t2 //Point parameter
    let Y1, Y2 //roots of equation 

    const disc = Math.pow(b, 2) - 4 * a * c
    console.log(x1, y1, x2, y2, x3, y3, X, d)

    if (disc < 0) {
        return undefined
    }
    else if (disc == 0) {
        t1 = (-b + Math.sqrt(disc)) / (2 * a)
        console.log({t1})
        Y1 = Math.pow((1 - t1), 2) * y1 + 2 * (1 - t1) * t1 * y2 + Math.pow(t1, 2) * y3
    }
    else {
        t1 = (-b + Math.sqrt(disc)) / (2 * a)
        t2 = (-b - Math.sqrt(disc)) / (2 * a)
        console.log({t1},{t2})
        Y1 = Math.pow((1 - t1), 2) * y1 + 2 * (1 - t1) * t1 * y2 + Math.pow(t1, 2) * y3
        Y2 = Math.pow((1 - t2), 2) * y2 + 2 * (1 - t2) * t2 * y2 + Math.pow(t2, 2) * y3
    }

    return [Y1, Y2]
}


function scaleByAni(){
    
    return ["#992425",
    "#044364",
    "#ecc21c",
    "#376f96",
    "#699f95",
    "#806b65",
    "#cf6367",
    "#64284c",
    "#28387d",
    "#ba4127"]
    
    return d3.schemeCategory10

    return ["#67001f","#6a011f","#6d0220","#700320","#730421","#760521","#790622","#7b0722","#7e0823","#810923","#840a24","#870b24","#8a0c25","#8c0d26","#8f0f26","#921027","#941127","#971228","#9a1429","#9c1529","#9f172a","#a1182b","#a41a2c","#a61c2d","#a81d2d","#aa1f2e","#ad212f","#af2330","#b12531","#b32732","#b52933","#b72b34","#b82e35","#ba3036","#bc3238","#be3539","#bf373a","#c13a3b","#c33c3d","#c43f3e","#c6413f","#c74441","#c94742","#ca4943","#cc4c45","#cd4f46","#ce5248","#d0544a","#d1574b","#d25a4d","#d45d4e","#d56050","#d66252","#d86554","#d96855","#da6b57","#db6d59","#dd705b","#de735d","#df755f","#e07861","#e17b63","#e27d65","#e48067","#e58369","#e6856b","#e7886d","#e88b6f","#e98d71","#ea9073","#eb9276","#ec9578","#ed977a","#ee9a7c","#ee9c7f","#ef9f81","#f0a183","#f1a486","#f2a688","#f2a88b","#f3ab8d","#f4ad90","#f4af92","#f5b295","#f5b497","#f6b69a","#f6b89c","#f7ba9f","#f7bda1","#f8bfa4","#f8c1a6","#f8c3a9","#f9c5ab","#f9c7ae","#f9c9b0","#facab3","#faccb5","#faceb8","#fad0ba","#fad2bc","#fad3bf","#fad5c1","#fbd7c4","#fbd8c6","#fbdac8","#fbdbca","#fbddcc","#fadecf","#fae0d1","#fae1d3","#fae2d5","#fae3d7","#fae5d8","#fae6da","#f9e7dc","#f9e8de","#f9e9e0","#f8eae1","#f8eae3","#f7ebe4","#f7ece6","#f6ede7","#f6ede8","#f5eee9","#f4eeeb","#f4efec","#f3efed","#f2efed","#f1efee","#f0f0ef","#eff0f0","#eef0f0","#edf0f1","#eceff1","#ebeff1","#eaeff2","#e9eff2","#e7eef2","#e6eef2","#e5edf2","#e3edf2","#e2ecf2","#e0ecf2","#dfebf2","#ddeaf2","#dbeaf1","#dae9f1","#d8e8f1","#d6e7f0","#d4e6f0","#d3e6f0","#d1e5ef","#cfe4ef","#cde3ee","#cbe2ee","#c9e1ed","#c7e0ed","#c5dfec","#c2ddec","#c0dceb","#bedbea","#bcdaea","#bad9e9","#b7d8e8","#b5d7e8","#b2d5e7","#b0d4e6","#aed3e6","#abd1e5","#a9d0e4","#a6cfe3","#a3cde3","#a1cce2","#9ecae1","#9cc9e0","#99c7e0","#96c6df","#93c4de","#91c3dd","#8ec1dc","#8bc0db","#88beda","#85bcd9","#83bbd8","#80b9d7","#7db7d7","#7ab5d6","#77b3d5","#74b2d4","#71b0d3","#6faed2","#6cacd1","#69aad0","#66a8cf","#64a7ce","#61a5cd","#5ea3cc","#5ba1cb","#599fca","#569dc9","#549bc8","#5199c7","#4f98c6","#4d96c5","#4b94c4","#4892c3","#4690c2","#448ec1","#428cc0","#408bbf","#3e89be","#3d87bd","#3b85bc","#3983bb","#3781ba","#3680b9","#347eb7","#337cb6","#317ab5","#3078b4","#2e76b2","#2d75b1","#2c73b0","#2a71ae","#296fad","#286dab","#266baa","#2569a8","#2467a6","#2365a4","#2164a2","#2062a0","#1f609e","#1e5e9c","#1d5c9a","#1b5a98","#1a5895","#195693","#185490","#17528e","#164f8b","#154d89","#134b86","#124983","#114781","#10457e","#0f437b","#0e4178","#0d3f75","#0c3d73","#0a3b70","#09386d","#08366a","#073467","#063264","#053061"]
}