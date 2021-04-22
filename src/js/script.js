const dataURL = "data/data_all.json"
const nodeWidth = 20 
const nodePadding = 10
const DEBUG = true
let data = {}
const filterObject = {
    source:undefined,
    target:undefined
}

$(document).ready(function () {
    $.get(dataURL, initSankeyDiagram, "json");

    function initSankeyDiagram(_data) {
        data = _data
        if(DEBUG){
            _data = fixAPPandSoruce(_data)
        }
        checkData(_data)
        initDestinationsSelect(_data)
        
        const grantTotalsData = calcGrantTotals(data,"appg",5)
        const _top = filterByTop(_data, grantTotalsData)
        showSankeyD3(_top, "#sankey", { nodeWidth, nodePadding })
    }

    function initDestinationsSelect(data) {
        const appgs = getSuggestionList(data, "appg")
        const mps = getMPsList(data)
        const sources = getSuggestionList(data, "source")
        const years = getSuggestionList(data,"date")
        initTypeHeadV2('#search_destinations', onOptionSelected, { data: appgs, title: "APPG" }, { data: mps, title: "MP" }, { data:sources, title:"Sources"})
        initTypeHead('#search_years', onYearSelected, { data: years, title: "Year" })
    }

});