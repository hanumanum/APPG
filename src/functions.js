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
        .bind("focus", clearAndReopenAll)
        .bind("click", clearAndReopenAll)

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

//TODO: may be not neccessery, decide later
function onOptionCleared(ev) {
    return 
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

function onYearSelected_tableVersion(ev, suggestion) {
    datarepo.addFilter("year", suggestion)
    const filtered = datarepo.getFiltered()
    showTableD3(filtered, "#tbody")
}

function onOptionSelected(ev, suggestion) {
    datarepo.addFilter("text", suggestion)
    const filtered = datarepo.getFiltered()
    showSankeyD3(filtered, "#sankey", { nodeWidth, nodePadding })
    showMPtoAPPGRelations(suggestion)
}

function onOptionSelected_tableVersion(ev, suggestion) {
    datarepo.addFilter("text", suggestion)
    const filtered = datarepo.getFiltered()
    showTableD3(filtered, "#tbody")
}


function onEnterShowText(d, b) {
    return
    const text = d.source.name + " &rarr; " + d.target.name + " <br> " + "£" + d3.format(",.2r")(d.value) + " (" + d.date + ")";
    const left = $(window).width() / 2 - $("#infopopap").width() / 2;
    $("#infopopap").css({ "left": left, "top": cursory - 50 })
    $("#infopopap").show()
    $("#infopopap").html(text)

}

function hideText() {
    $("#infopopap").hide()
    $("#infopopap").text("")
}

const onLeaveShowText = debounce(hideText, 800)

function clearAndReopenAll(e) {
    $("#" + e.target.id).typeahead('val', "");
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
        console.log({ t1 })
        Y1 = Math.pow((1 - t1), 2) * y1 + 2 * (1 - t1) * t1 * y2 + Math.pow(t1, 2) * y3
    }
    else {
        t1 = (-b + Math.sqrt(disc)) / (2 * a)
        t2 = (-b - Math.sqrt(disc)) / (2 * a)
        console.log({ t1 }, { t2 })
        Y1 = Math.pow((1 - t1), 2) * y1 + 2 * (1 - t1) * t1 * y2 + Math.pow(t1, 2) * y3
        Y2 = Math.pow((1 - t2), 2) * y2 + 2 * (1 - t2) * t2 * y2 + Math.pow(t2, 2) * y3
    }

    return [Y1, Y2]
}


function scaleByAni() {

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
}


function initMouseCoordinates() {
    window.cursorx = 0
    window.cursory = 0

    document.onmousemove = handleMouseMove;
    function handleMouseMove(event) {
        var eventDoc, doc, body;

        event = event || window.event; // IE-ism
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                (doc && doc.clientTop || body && body.clientTop || 0);
        }

        window.cursorx = event.pageX
        window.cursory = event.pageY
    }
}


function debounce(func, wait = 300, immediate) {
    var timeout
    return function () {
        const context = this, args = arguments
        const later = function () {
            timeout = null
            if (!immediate) func.apply(context, args)
        }
        const callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
        if (callNow) func.apply(context, args)
    }
}