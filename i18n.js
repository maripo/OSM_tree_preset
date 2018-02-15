/**
	Yet Another Tree Preset Generator for JOSM
	Tool to extract data from Wikidata's xml files
	Node.js
*/


let fs = require('fs');
let builder = require('xmlbuilder');
let parseString = require('xml2js-parser').parseString;

function readFile (file, onSuccess, onError) {
	fs.readFile(file, 'utf8', function(err, data) {
		if (err) {
			onError(err);
		} else {
				onSuccess(data);
		}
	});
}


function processData (json) {
	for (let i in json.results.bindings) {
		let keyUri = json.results.bindings[i].k.value;
		let v = json.results.bindings[i].v;
		let lang = v["xml:lang"];
		let value = v.value;
		if (lang) {
			console.log(lang);
		}
		console.log(keyUri + "->" + v.value);
	}
}

(function(){
	let inFile = null;
	let outFile = null;
	readFile("wikidata/Q157763.json", function (content) {
			processData(JSON.parse(content));
		},
		function(err) {
			console.log("Error " + err);
		}
	);
})();