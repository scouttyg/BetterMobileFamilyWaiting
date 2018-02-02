"use strict";

var intervalID = 0;
var localPreviousInputString = localStorage.getItem("umichMedPreviousInputs");
var previousInputsArray = [];
var localStorageAvailable = canUseLocalStorage();

if (localPreviousInputString === null) {
    localStorage.setItem("umichMedPreviousInputs", JSON.stringify(previousInputsArray));
} else {
    previousInputsArray = JSON.parse(localStorage.getItem("umichMedPreviousInputs"));
}

// Function that checks if the browser being used can use localStorage
function canUseLocalStorage() {
    var test = "test";
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Function that adds an item to local storage
function addToLocalStorage(item) {
    previousInputsArray = JSON.parse(localStorage.getItem("umichMedPreviousInputs"));
    if (previousInputsArray.indexOf(item) === -1) {
        previousInputsArray.push(item);
        localStorage.setItem("umichMedPreviousInputs", JSON.stringify(previousInputsArray));
    }

}


// Sets the dropdown items that occur under an input based on what is submitted
function setAutocompleteFromLocalStorage() {
    previousInputsArray = JSON.parse(localStorage.getItem("umichMedPreviousInputs"));
    var dataList = document.getElementById("local-datalist");
    dataList.innerHTML = "";

    for (var i = 0; i < previousInputsArray.length; i += 1) {
        var newOption = document.createElement("option");
        newOption.value = previousInputsArray[i];
        dataList.appendChild(newOption);
    }
}

// Called when there's a move event on the body itself:
function blockMove(event) {
    // Tell Safari not to move the window.
    event.preventDefault();
}

// Body OnLoad
function bodyLoad() {
    $("#caseentry").show();
    $("#caseresult").hide();

    if (previousInputsArray.length > 0) {
        setAutocompleteFromLocalStorage();
    }
}

// Back to search
function backToSearch() {
    clearInterval(intervalID);
    $("#caseresult").hide();
    $("#caseentry").show();
}

function parseResponseData(data) {
    var obj = jQuery.parseJSON(data);
    $("#tableq").empty();

    var tableRef = document.getElementById("tableq");
    var tbo = document.createElement("tbody");

    var attributes = [{name: "Case", value: obj.CaseNo.toString()}, {name: "Status", value: obj.Status}, {name: "Room Start", value: obj.RoomStartStr}, {name: "Incision", value: obj.IncisionStr}, {name: "Dressing End", value: obj.DressEndStr}, {name: "Patient in Recovery", value: obj.PhaseIInStr}, {name: "Last Updated", value: obj.LastUpdatedStr}];

    // Loop through the attributes array and write out the table rows and table data based
    for (var i = 0; i < attributes.length; i += 1) {
        // Description name table data
        var row = document.createElement("tr");
        var cell = document.createElement("td");
        var cont = document.createTextNode(attributes[i].name + ":");
        cell.align = "right";
        cell.appendChild(cont);
        row.appendChild(cell);

        // Value from returned JSON table data
        var cell = document.createElement("td");
        var cont = document.createTextNode(attributes[i].value);
        cell.appendChild(cont);
        row.appendChild(cell);

        // Append the table row with the two tds to the table body
        tbo.appendChild(row);
    }

    // Append the tbody to the reference table
    tableRef.appendChild(tbo);

    // Style the table
    tableRef.style.backgroundColor = "#FFFFFF";
    tableRef.style.left = "7px";
    tableRef.style.width = (window.innerWidth - 14).toString() + "px";

    var x = document.getElementById("backbutton");
    x.style.top = tableRef.offsetTop + tableRef.offsetHeight + 5;
    x.style.left = tableRef.style.left;
    x.style.width = tableRef.style.width;
}

// Loads data from response to serverr and puts contents in table (or alerts failure)
function loadData() {
    var caseNum = document.getElementById("casetext");

    if ((caseNum.value !== null && !(typeof caseNum.value === "string" && caseNum.value.trim() === "")) && localStorageAvailable) {
        addToLocalStorage(caseNum.value);
        setAutocompleteFromLocalStorage();
    }

    try {
        var webMethod = "https://orpublic.med.umich.edu/MFW/MFWService/MobileFamilyWaiting.asmx/getFamWait";
        var parameters = "{'casenum':'" + caseNum.value + "'}";

        $.ajax({
            type: "POST",
            url: webMethod,
            data: parameters,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (msg) {
                parseResponseData(msg.d)
            },
            error: function (e) {
                alert("Error! " + e.status + ": " + e.statusText + "; " + e.toString());
                backToSearch();
            }
        });
    } catch (e) {
        var txt = "There was an error on this page.\n\n";
        txt += "Error description: " + e.message + "\n\n";
        txt += "Click OK to continue.\n\n";
        alert(txt);
        backToSearch();
    }
}

// Called when user presses find case num
function findCase() {
    $("#caseentry").hide();
    $("#caseresult").show();
    intervalID = setInterval("loadData()", 60000);
    loadData();
}