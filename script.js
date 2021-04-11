const dataURL = "data/data.json"
const nodeWidth = 20 
const nodePadding = 10
let data = {}
const filterObject = {
    source:"",
    target:""
} 


$(document).ready(function () {
    $.get(dataURL, initSankeyDiagram, "json");

    function initSankeyDiagram(_data) {
        
        data = _data
        checkData(data)
        initSourceSelect(data)
        initDestinationsSelect(data)

        showSankeyD3(data, "#sankey", { nodeWidth, nodePadding })

        /* //just tests 
        const filtered = filterBy(data, "appg", "Beer")
        const filteredByMP = filterByMP(data, "Dehenna Davison")
        console.log({filtered}, {filteredByMP})
        //end of just tests 
        */
    }

    function initSourceSelect(data) {
        const companies = getSuggestionList(data, "source")
        initTypeHead('#search_sources', onOptionSelected.bind(data), { data: companies, title: "Company" })
    }

    function initDestinationsSelect(data) {
        const appgs = getSuggestionList(data, "appg")
        const mps = getMPsList(data)
        initTypeHead('#search_destinations', onOptionSelected, { data: appgs, title: "APPG" }, { data: mps, title: "MP" })
    }

});