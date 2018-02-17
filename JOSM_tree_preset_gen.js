/**
	Yet Another Tree Preset Generator for JOSM
	Node.js
*/

let fs = require('fs');
let wds = require('./wikidata_species.js');
let builder = require('xmlbuilder');

let LANGUAGES = ["en", "ja", "zh-cn", "zh-tw", "ko"];

function read (file, onSuccess, onError) {
	fs.readFile(file, 'utf8', function(err, data) {
		if (err) {
			onError(err);
		} else {
			onSuccess(data);
		}
	});
}

// Attribute of item's node itself
class FieldRootAttr {
	constructor (key) {
		this.key = key;
	}
	append (node, value) {
		if (value && value.length) {
			node.att(this.key, value);
		}
	}
}

// Simple Key-value pair
class FieldText {
	constructor (key) {
		this.key = key;
	}
	append (node, value) {
		if (value && value.length > 0) {
			node.ele("key", {"key":this.key, "value":value});
		}
	}
}

// Key-value field (defined by dropdown options)
class FieldAnnotatedText {
	constructor (key) {
		this.key = key;
	}
	append (node, value) {
		value = value.replace(/ \(.*\)/, "");
		if (value && value.length > 0) {
			node.ele("key", {"key":this.key, "value":value});
		}
	}
}

// Dropdown menu
class FieldCombo {
	constructor (key, label, values) {
		this.key = key;
		this.label = label;
		this.values = values;
	}
	append (node, value) {
		if (value == "yes") {
			node.ele("combo", {"key":this.key, "text":this.label, "values":this.values.join(",")});
		}
	}
}

class FieldLink {
	constructor () {
	}
	append (node, value) {
		if (value && value.length > 0) {
			node.ele("link", {"href":"https://www.wikidata.org/wiki/" + value});
		}
	}
}

const COLUMNS = [
	new FieldRootAttr("name"),
	new FieldAnnotatedText("leaf_type"),
	new FieldText("genus"),
	new FieldText("species"),
	new FieldText("genus:ja"),
	new FieldText("genus:en"),
	new FieldText("taxon"),
	new FieldCombo("sex", "雌雄", ["male","female"]),
	new FieldAnnotatedText("leaf_cycle"),
	new FieldLink()
];
const WIKIDATA_COLUMN_ID_INDEX = 10;

class Group {
	constructor (values) {
		this.name = values[0];
	}
	appendNodeTo (parentNode, wikdiata) {
		return parentNode.ele("group",{name:this.name});
	}
}

class Preset {
	constructor (values) {
		this.values = values;
	}
	isNeedleleaved () {
		for (let i=0; i<this.values.length; i++) {
			if (this.values[i].indexOf("needleleaved")>=0) {
				return true;
			}
		}
		return false;
	}
	appendNodeTo (parentNode, wikidata) {
		let presetName = this.values[0];
		let itemNode = parentNode.ele("item", {"name":presetName, 
			"icon":this.isNeedleleaved()?"presets/landmark/trees_conifer.svg":"presets/landmark/trees.svg"});
		if (wikidata) {
			for (let i in LANGUAGES) {
				let lang = LANGUAGES[i];
				let label = wikidata.name[lang] || wikidata.label[lang];
				// console.log("Wikidata found. " + lang + "->" + (wikidata.name[lang] || wikidata.label[lang]));
				if (label) {
					itemNode.att(lang+".name", label);
				}
			}
		}
		// default fields (label, name)
		itemNode.ele("label", {"text":presetName});
		itemNode.ele("text",{ "key":"name", "text":"名前" });
		
		for (let i=0; i<Math.min(this.values.length, COLUMNS.length); i++) {
			COLUMNS[i].append(itemNode, this.values[i]);
		}
		itemNode.ele("reference", {"ref":"japan_trees"});
		return itemNode;
	}
}

const PATH_TYPE_ERROR = 0;
const PATH_TYPE_ITEM = 1;
const PATH_TYPE_GROUP = 2;

function parseHierarchy (str) {
	let depth = 0;
	str = "" + str;
	for (let i=0; i<str.length; i++) {
		let ch = (str).charAt(i);
		if (ch=='-') {
			return {type:PATH_TYPE_ITEM, depth:depth};
		}
		if (ch=='+') {
			return {type:PATH_TYPE_GROUP, depth:depth};
		}
		depth++;
	}
	return {type:PATH_TYPE_ERROR}
}
function fetchWikidata (wikidataIds, callback) {
	let map = {};
	console.log(wikidataIds.join(", "));
	if (wikidataIds.length==0) {
		// Has no wikidata ID
		callback(map);
	}
	let fetchedCount = 0;
	for (let i=0; i<wikidataIds.length; i++) {
		let wikidataId = wikidataIds[i];
		console.log(wikidataId);
		wds.getWikidata(wikidataId, 
			function (obj) {
				console.log("=== https://www.wikidata.org/wiki/" + wikidataId + "===");
				debugObj(obj);
				map[wikidataId] = obj;
				fetchedCount++;
				if (fetchedCount == wikidataIds.length) {
					console.log("ALL DATA FETCHED.");
					callback(map);
				}
			},
			function (err) {console.log("onError");}
		);
	}
}
function parse (content, callback) {
	let lines = content.split("\n");
	
	let xml = builder.create("presets");
	xml.att("xmlns","http://josm.openstreetmap.de/tagging-preset-1.0");
	xml.att("author","Maripo GODA and contributors");
	xml.att("description","日本でよく見られる樹木のプリセットです");
	xml.att("shortdescription","日本の樹木");
	
	// Default fields
	let chunk = xml.ele("chunk",{"id":"japan_trees"});
	chunk.ele("text",{ "key":"operator", "text":"運営者" });
	chunk.ele("text",{ "key":"ref", "text":"参照番号" });
	chunk.ele("text",{ "key":"height", "text":"高さ(m)" });
	chunk.ele("text",{ "key":"circumference", "text":"幹の外周(m)" });
	chunk.ele("combo", {"key":"denotation", "text":"特徴", "values":"landmark,natural_monument,avenue,urban"});
	chunk.ele("check", {"key":"monument", "text":"記念樹"});
	
	// Container of all trees
	let group = xml.ele("group", {"name":"樹木"});
		 	
	let breadcrumb = [group];
	let depth = 0;
	let wikidataIds = [];
	for (let i=1; i<lines.length; i++) {
		let values = lines[i].replace("\r","").replace("\n","").split("\t");
		let wikidataId = values[WIKIDATA_COLUMN_ID_INDEX];
		if (wikidataId!=null && wikidataId.length>0 && wikidataId.match(/^Q[0-9]+/)) {
			//console.log(wikidataId)
			wikidataIds.push(wikidataId);
		}
	}
	console.log(wikidataIds.length + " Wikidata IDs found.");
	fetchWikidata(wikidataIds, function (wikdiataMap) {
		for (let i=1; i<lines.length; i++) {
			let values = lines[i].replace("\r","").replace("\n","").split("\t");
			let wikidataId = values[WIKIDATA_COLUMN_ID_INDEX];
			let pathStr = values.splice(0, 1);
			let path = parseHierarchy(pathStr);
			if (path.type==PATH_TYPE_ITEM) {
				//console.log("Hoge " + values[WIKIDATA_COLUMN_ID_INDEX-1]);
				breadcrumb[path.depth+1] = new Preset(values).appendNodeTo(breadcrumb[path.depth], wikdiataMap[wikidataId]);
			}
			 else {
			 	breadcrumb[path.depth+1] = new Group(values).appendNodeTo(breadcrumb[path.depth], wikdiataMap);
			 }
		}
		callback(xml);	
	});

}

function debugObj (obj) {
	console.log("species=" + obj.species);
	console.log("taxon=" + obj.taxon);
	let langs = ["en", "ja", "zh-ch", "zh-tw", "ko"];
	for (let i in langs) {
		let lang = langs[i];
		console.log(lang + "->" + (obj.name[lang] || obj.label[lang]));
	}

}

const PRUNUS_MUME =  "Q157763";
const GINKGO_BILOBA = "Q43284";
(function(){

	/*
	wds.getWikidata(PRUNUS_MUME, 
		function (obj) {console.log("onSuccess"); debugObj(obj); },
		function (err) {console.log("onError");}
	);
	*/
	let inFile = null;
	let outFile = null;
	process.argv.forEach(function (value, index, array) {
		if (index == 2)
			inFile = value;
		if (index == 3)
			outFile = value;
	});
	if (!inFile || !outFile) {
		console.log("Usage:  node JOSM_tree_preset_gen.js <in_file> <out_file>");
		return;
	}
	read(inFile, function (content) {
			parse(content, function (xml) {
				fs.writeFileSync(outFile, xml.end({pretty:true}));
			});
		}, 
		function(err){
			console.log("Error " + err);
		}
	);
})();