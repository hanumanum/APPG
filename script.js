$(document).ready(function () {
    const dataURL = "data.json"
    $.get(dataURL, initSankeyDiagram,"json");


    function initSankeyDiagram(data, textStatus, jqXHR){
        initSourceSelect(data)
        initDestinationsSelect(data)

        /* //just tests 
        const filtered = filterBy(data, "appg", "Beer")
        const filteredByMP = filterByMP(data, "Dehenna Davison")
        console.log({filtered}, {filteredByMP})
        //end of just tests 
        */
    }

    function initSourceSelect(data){
        const companies =  getSuggestionList(data, "source")
        
        //console.log({companies})
    }

    function initDestinationsSelect(data){
        const appgs = getSuggestionList(data, "appg")
        const mps =   getMPsList(data)
    }

});