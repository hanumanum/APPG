const dataURL = "../data/data_all.json"
const nodeWidth = 20 
const nodePadding = 25
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

        //datarepo.addFilter("top", true)
        datarepo.addFilter("year", 2020)
        const top = datarepo.getFiltered()
        //const all = datarepo.getAll()
        showTableD3(top, "#tbody")
    }

    function initTypeheadSelect(data) {
        const appgs = datarepo.getSuggestionList("appg")
        const mps = datarepo.getMPsList()
        const sources = datarepo.getSuggestionList("source")
        const years = datarepo.getSuggestionList("date")
        //years.push("All years")
        initTypeHead('#search_destinations', onOptionSelected_tableVersion, [{ data: mps, title: "MP" }, { data: appgs, title: "APPG" },  { data:sources, title:"Sources"}])
        initTypeHead('#search_years', onYearSelected_tableVersion, [{ data: years, title: "Year" }])
    }

});