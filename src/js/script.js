const dataURL = "data/data_all.json"
const nodeWidth = 20 
const nodePadding = 10
const DEBUG = true
initMouseCoordinates()
let datarepo;


$(document).ready(function () {
    $.get(dataURL, initSankeyDiagram, "json");

    function initSankeyDiagram(_data) {
        data = _data
        
        datarepo = dataRepository(data)
        initTypeheadSelect(datarepo.getAll())
        //const bounds = datarepo.getValueBounds()
        //console.log(bounds)

        datarepo.addFilter("top", true)
        const top = datarepo.getFiltered()
        showSankeyD3(top, "#sankey", { nodeWidth, nodePadding })
    }

    function initTypeheadSelect(data) {
        const appgs = datarepo.getSuggestionList("appg")
        const mps = datarepo.getMPsList()
        const sources = datarepo.getSuggestionList("source")
        const years = datarepo.getSuggestionList("date")
        initTypeHead('#search_destinations', onOptionSelected, [{ data: mps, title: "MP" }, { data: appgs, title: "APPG" },  { data:sources, title:"Sources"}])
        initTypeHead('#search_years', onYearSelected, [{ data: years, title: "Year" }])
    }

});