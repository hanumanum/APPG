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
        $(selector).typeahead(conf,opt1, opt2);
    }
    else{
        $(selector).typeahead(conf, opt1);
    }


    $(selector).bind("typeahead:select", onOptionSelected)

}

function onOptionSelected(ev, suggestion){
    console.log({ev, suggestion})
}