/**
	Yet Another Tree Preset Generator for JOSM
	Tool to extract data from Wikidata's xml files
	Node.js
*/


let fs = require('fs');
var https = require('https');

function readFile (file, onSuccess, onError) {
	fs.readFile(file, 'utf8', function(err, data) {
		if (err) {
			onError(err);
		} else {
				onSuccess(data);
		}
	});
}

/*
Main label (to localize)
	http://www.w3.org/2000/01/rdf-schema#label
Taxon name (key=species)
	http://www.wikidata.org/prop/direct/P225
Taxon rank (key=taxon)
	http://www.wikidata.org/prop/P105
*/
const KEY_TAXON_NAME = "http://www.wikidata.org/prop/direct/P225";
const KEY_TAXON_RANK = "http://www.wikidata.org/prop/P105";
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
			taxonRank = value;
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
	console.log("species=" + taxonName);
	console.log("taxon=" + taxonRank);
	let langs = ["en", "ja", "zh", "ko"];
	console.log("Labels");
	for (let i in langs) {
		let lang = langs[i];
		console.log(lang + "->" + labels[lang]);
	}
	console.log("Common names");
	for (let i in langs) {
		let lang = langs[i];
		console.log(lang + "->" + commonNames[lang]);
	}
}
let WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

function download (url, filePath, callback) {
	var file = fs.createWriteStream(filePath);
	console.log("Download " + url);
	var request = https.get(url, function(response) {
		console.log("Response="+response);
		response.pipe(file);
		file.on("finish", function() {
			file.close(callback);
		});
	});
}

function findJSON (wikidataId, callback) {
	let cachePath = "wikidata/" + wikidataId + ".json"
	console.log("file=" + cachePath);
	if (fs.existsSync(cachePath)) {
		console.log("Cache exists."); 
		callback();
	} else {
		console.log("Download.");
		let query = "SELECT * WHERE { wd:" + wikidataId + " ?k ?v }";
		let wikidataURL = WIKIDATA_ENDPOINT + "?format=json&query=" + encodeURIComponent(query);
		download (wikidataURL, cachePath, function () {
			console.log("cache saved.");
			callback();
		});
	}
}

function getWikidata (wikidataId, onSuccess, onError) {
	findJSON(wikidataId, function(){});
	return;
	readFile(cachePath, function (content) {
			processData(JSON.parse(content));
		},
		function(err) {
			console.log("Error " + err);
		}
	);

}
const PRUNUS_MUME =  "Q157763";
const GINKGO_BILOBA = "Q43284";

(function(){
	getWikidata(GINKGO_BILOBA, 
		function (obj) {console.log("onSuccess");},
		function (err) {console.log("onError");}
	);
})();