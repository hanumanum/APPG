const dataURL = "../data/data_all.json"
const nodeWidth = 20 
const nodePadding = 25
const DEBUG = true
let datarepo;


$(document).ready(function () {
    $.get(dataURL, initTableDiagram, "json");

    function initTableDiagram(_data) {
        datarepo = dataRepository(_data)
        const all = datarepo.getAll()
        showTableD3(all, "#tbody", true)
    }


});