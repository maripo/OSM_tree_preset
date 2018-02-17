/**
	Yet Another Tree Preset Generator for JOSM
	Tool to extract data from Wikidata's xml files
	Node.js
*/


let fs = require('fs');
var https = require('https');


/*
Main label (to localize)
	http://www.w3.org/2000/01/rdf-schema#label
Taxon name (key=species)
	http://www.wikidata.org/prop/direct/P225
Taxon rank (key=taxon)
	http://www.wikidata.org/prop/P105
*/
const KEY_TAXON_NAME = "http://www.wikidata.org/prop/direct/P225";
const KEY_TAXON_RANK = "http://www.wikidata.org/prop/direct/P105";
const KEY_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const KEY_COMMON_NAME = "http://www.wikidata.org/prop/direct/P1843";

function processData (json) {
	let taxonName = null;
	let taxonRank = null;
	let labels = {}; // languages map
	let commonNames = {}; // languages map
	for (let i in json.results.bindings) {
		let keyUri = json.results.bindings[i].k.value;
		let v = json.results.bindings[i].v;
		let value = v.value;
		
		if (keyUri==KEY_TAXON_NAME) {
			taxonName = value;
		} else if (keyUri==KEY_TAXON_RANK) {
			//http://www.wikidata.org/entity/Q7432	species
			//http://www.wikidata.org/entity/Q7432
			taxonRank = taxonTable[value];
		} else if (keyUri==KEY_LABEL) {
			let lang = v["xml:lang"];
			if (lang) {
				labels[lang] = value;
			}
		} else if (keyUri==KEY_COMMON_NAME) {
			let lang = v["xml:lang"];
			if (lang) {
				commonNames[lang] = value;
			}
		}
		
		
	}
	return {
		"species":taxonName,
		"taxon": taxonRank,
		"name": commonNames,
		"label": labels
	};
}
let WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

function download (url, filePath, callback) {
	var file = fs.createWriteStream(filePath);
	var request = https.get(url, function(response) {
		response.pipe(file);
		file.on("finish", function() {
			file.close(callback);
		});
	});
}

function readFile (file, onSuccess, onError) {
	fs.readFile(file, 'utf8', function(err, data) {
		if (err) {
			onError(err);
		} else {
			onSuccess(data);
		}
	});
}

function downloadCached (downloadURL, cachePath, callback) {
	console.log("file=" + cachePath);
	if (fs.existsSync(cachePath)) {
		console.log("Cache exists. " + cachePath);
		readFile(cachePath, callback);
	} else {
		console.log("Cache not found. Download " + downloadURL);
		download (downloadURL, cachePath, callback);
	}
}

function getWikidata (wikidataId, onSuccess, onError) {
	loadTaxonRankTable(function() {
		let cachePath = "wikidata/" + wikidataId + ".json"
		let query = "SELECT * WHERE { wd:" + wikidataId + " ?k ?v }";
		let wikidataURL = WIKIDATA_ENDPOINT + "?format=json&query=" + encodeURIComponent(query);
		downloadCached(wikidataURL, cachePath, function () {
			readFile(cachePath, function (content) {
					onSuccess(processData(JSON.parse(content)));
				},
				function(err) {
					onError(err);
				}
			);
		});
	});
}

function debugObj (obj) {
	console.log("species=" + obj.species);
	console.log("taxon=" + obj.taxon);
	let langs = ["en", "ja", "zh", "ko"];
	console.log("Names");
	for (let i in langs) {
		let lang = langs[i];
		console.log(lang + "->" + obj.name[lang]);
	}

}
const TAXON_RANK_TSV = "wikidata/taxon_ranks.tsv";
let taxonTable = null;
function loadTaxonRankTable (callback) {
	if (taxonTable) {
		callback(); return;
	}
	taxonTable = [];
	readFile(TAXON_RANK_TSV, function (content) {
			console.log(content);
			let lines = content.split("\n");
			for (let i in lines) {
				let values = lines[i].split("\t");
				taxonTable[values[0]] = values[1]; 
			}
			callback();
		},
		function(err) {
			console.log("Error. Failed to load " + TAXON_RANK_TSV);
		}
	);
}

const PRUNUS_MUME =  "Q157763";
const GINKGO_BILOBA = "Q43284";
/*
// Demo code
(function(){
	getWikidata(GINKGO_BILOBA, 
		function (obj) {console.log("onSuccess"); debugObj(obj); },
		function (err) {console.log("onError");}
	);
})();
*/

exports.getWikidata = function (wikidataId, onSuccess, onError) {
	getWikidata(wikidataId, onSuccess, onError);
};