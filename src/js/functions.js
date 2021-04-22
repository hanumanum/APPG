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


function filterByTop(data) {
    const grantTotalsData = calcGrantTotals(data,"appg",5)
    const topsArray = grantTotalsData.map(function (currentValue) {
        return Object.keys(currentValue)[0]
    })

    function filterCondition(currentValue) {
        return topsArray.includes(currentValue.appg)
    }
    return data.filter(filterCondition)
}


function filterByFilter(data, filter) {
    if (filter.target == undefined && filter.year == undefined) {
        const _top = filterByTop(data)
        return _top;
    }

    function getFilterContition(v) {
        const defaultFilter = (v.source == filter.source || v.source == filter.target || v.appg == filter.target || v.mps.includes(filter.target))
        const yearFilter = (v.date == filter.year)

        if (filter.year && filter.target == undefined) {
            return yearFilter
        }
        else if (filter.target && filter.year == undefined) {
            return defaultFilter
        }
        else {
            return defaultFilter && yearFilter
        }

    }

    const _data = data.filter(getFilterContition)
    return _data;
}

function calcGrantTotals(data, field, topCount = 10) {
    function calcGrants(accumulator, currentValue) {
        //console.log(currentValue[field])

        if (!(currentValue[field] in accumulator)) {
            accumulator[currentValue[field]] = 0
        }
        accumulator[currentValue[field]] += currentValue['total']
        return accumulator
    }

    function makeArrayFromObject(accumulator, currentValue) {
        accumulator.push({ [currentValue]: grantTotals[currentValue] })
        return accumulator;
    }

    function sorter(a, b) {
        return b[Object.keys(b)[0]] - a[Object.keys(a)[0]]
    }

    const grantTotals = data.reduce(calcGrants, {})
    const grantTotalsOrdered = Object.keys(grantTotals)
        .reduce(makeArrayFromObject, [])
        .sort(sorter)
        .splice(0, topCount)


    return grantTotalsOrdered
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

function checkData(data) {
    const same = data.filter(function (d) {
        return d.appg === d.source
    })

    if (same.length) throw new UserException('appg and source can`t be same', same);
}

function fixAPPandSoruce(data) {
    console.warn("DATA ERRORS FIXED, BUT YOU NEED TO CHECK DATA")

    return data.map(function (d) {
        if (d.appg === d.source) {
            d.source += "_"
        }
        return d
    })
}


function calcHeight(data, ratio) {
    return 1200

    if (data.length < 30) return 650
    return data.reduce(function (accumulator, currentValue) {
        return accumulator + currentValue.total / data.length
    }, 0) * ratio

}

function formatForSankey(data) {
    const sankeyData = {
        nodes: []  //array of {name:value}
        , links: []  //array of {source:value, target:value, value:value}
    }

    const allNodes = getSuggestionList(data, "source").concat(getSuggestionList(data, "appg"))
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
            date: d.date
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


function initTypeHead(selector, onOptionSelected, options1, options2 = null) {
    const opt1 = createOptionsFonfig(options1);
    const conf = {
        highlight: true,
        minLength: 0,
        hint: true
    }

    if (options2) {
        const opt2 = createOptionsFonfig(options2);
        $(selector).typeahead(conf, opt1, opt2);
    }
    else {
        $(selector).typeahead(conf, opt1);
    }

    $(selector).bind("typeahead:select", onOptionSelected)
    $(selector).bind("keyup", onOptionCleared)

}


function initTypeHeadV2(selector, onOptionSelected, options1, options2, options3) {
    const conf = {
        highlight: true,
        minLength: 0,
        hint: true
    }


    const opt1 = createOptionsFonfig(options1);
    const opt2 = createOptionsFonfig(options2);
    const opt3 = createOptionsFonfig(options3);

    $(selector).typeahead(conf, opt1, opt2, opt3);
    $(selector).bind("typeahead:select", onOptionSelected)
    $(selector).bind("keyup", onOptionCleared)

}


function distinctMetaInfo(data) {
    return data.reduce(function (accumulator, currentValue) {
        const first = accumulator[currentValue.appg]
        const second = currentValue.mps
        accumulator[currentValue.appg] = concatDistinct(first, second)
        return accumulator
    }, {})
}


function showMetas(data, filterObject, onClick) {
    $("#destinations_meta ul").empty()
    const distinctedData = distinctMetaInfo(data)
    if (filterObject.source || filterObject.target) {
        Object.keys(distinctedData).map(function (d) {
            const mpsList = "<ul><li class='selected_option'>" + distinctedData[d].join("</li><li class='selected_option'>") + "</li></ul>";
            const mpGrUl = $("<li>").prepend(d).append(mpsList)
            $("#destinations_meta > ul").append(mpGrUl)
        })
    }

    if (onClick) {
        $(".selected_option").on("click", onClick)
    }

}

function showSankeyD3(data, containerSelector, conf) {
    $(containerSelector).empty();

    if (!data.length) {
        $(containerSelector).text("no data for current filters");
        return;
    }

    const height = calcHeight(data, 1)
    const width = $(containerSelector).width()
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

    const defs = svg.append('defs');

    // Color scale used
    const color = d3.scaleOrdinal(d3.schemeCategory20);
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
        .sort(function (a, b) { return b.dy - a.dy; })





    const linkTexts = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("text")
        .text(function (d) { return d.date + " - £" + d3.format(",.2r")(d.value); })
        .attr("x", function (d) { return d.source.x + (d.target.x - d.source.x) / 2; })
        .attr("y", function (d) { return d.source.y + d.sy + d.dy / 1.5 })

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
        console.log(d.source.color, d.target.color);

        const gradientID = `gradient${i}`;
        const startColor = d.source.color;
        const stopColor = d.target.color;
        console.log(gradientID)

        const linearGradient = defs.append('linearGradient')
            .attr('id', gradientID);

        linearGradient.selectAll('stop')
            .data([
                { offset: '10%', color: startColor },
                { offset: '90%', color: stopColor }
            ])
            .enter().append('stop')
            .attr('offset', d => {
                //console.log('d.offset', d.offset);
                return d.offset;
            })
            .attr('stop-color', d => {
                //console.log('d.color', d.color);
                return d.color;
            });

        return `url(#${gradientID})`;
    })


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



function onOptionCleared(ev) {
    if (ev.target.value == "") {
        if (ev.target.id == "search_sources") {
            filterObject.source = undefined
        }

        if (ev.target.id == "search_destinations") {
            filterObject.target = undefined
        }

        $(ev.target).trigger("typeahead:select")
    }

}


function onYearSelected(ev, suggestion) {
    filterObject.year = suggestion

    const _data = filterByFilter(data, filterObject)
    showSankeyD3(_data, "#sankey", { nodeWidth, nodePadding })
    showMetas(_data, filterObject, onClickChangeValue)
}


function onOptionSelected(ev, suggestion) {
    if (ev.target.id == "search_sources") {
        filterObject.source = suggestion
    }

    if (ev.target.id == "search_destinations") {
        filterObject.target = suggestion
    }

    const _data = filterByFilter(data, filterObject)
    showSankeyD3(_data, "#sankey", { nodeWidth, nodePadding })
    showMetas(_data, filterObject, onClickChangeValue)
}

function onClickChangeValue(e) {
    filterObject.target = e.target.innerText
    const _data = filterByFilter(data, filterObject)
    showSankeyD3(_data, "#sankey", { nodeWidth, nodePadding })
    showMetas(_data, filterObject, onClickChangeValue)
    $('#search_destinations').val(filterObject.target)
}
