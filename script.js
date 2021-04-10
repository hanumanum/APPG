$(document).ready(function () {
    const dataURL = "data.json"
    $.get(dataURL, initSankeyDiagram, "json");


    function initSankeyDiagram(data, textStatus, jqXHR) {
        initSourceSelect(data)
        initDestinationsSelect(data)

        /* //just tests 
        const filtered = filterBy(data, "appg", "Beer")
        const filteredByMP = filterByMP(data, "Dehenna Davison")
        console.log({filtered}, {filteredByMP})
        //end of just tests 
        */
    }

    function initSourceSelect(data) {
        const companies = getSuggestionList(data, "source")
        initTypeHead('#search_sources',onOptionSelected,{data:companies, title:"Company"})
    }

    function initDestinationsSelect(data) {
        const appgs = getSuggestionList(data, "appg")
        const mps = getMPsList(data)
        initTypeHead('#search_destinations',onOptionSelected, {data:appgs, title:"APPG"},{data:mps, title:"MP"})
    }


});