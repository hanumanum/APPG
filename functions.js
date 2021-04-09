function distinct(value, index, self) {
    return self.indexOf(value) === index 
}

function getSuggestionList(data, keyname) {
    return data.map(function (d) { return d[keyname] }).filter(distinct).sort()
}

function getMPsList(data){
    return data.reduce(function(accumulator, currentValue){ 
        return accumulator.concat(currentValue.mps)
    }, []).filter(distinct).sort()
}

function filterBy(data, key, value){
    return data.filter(function(v){
        return v[key] === value
    })
}

function filterByMP(data, name){
    return data.filter(function(v){
        return v.mps.includes(name)
    })
}
