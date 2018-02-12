/**
	Yet Another Tree Preset Generator for JOSM
	Node.js
*/

let fs = require('fs');
let builder = require('xmlbuilder');

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

const COLUMNS = [
	new FieldRootAttr("name"),
	new FieldAnnotatedText("leaf_type"),
	new FieldText("genus"),
	new FieldText("species"),
	new FieldText("genus:ja"),
	new FieldText("genus:en"),
	new FieldText("taxon"),
	new FieldCombo("sex", "雌雄", ["male","female"]),
	new FieldAnnotatedText("leaf_cycle")
];

class Group {
	constructor (values) {
		this.name = values[0];
	}
	appendNodeTo (parentNode) {
		return parentNode.ele("group",{name:this.name});
	}
}

class Preset {
	constructor (values) {
		this.values = values;
	}
	appendNodeTo (parentNode) {
		let presetName = this.values[0];
		let itemNode = parentNode.ele("item", {"name":presetName, "icon":"presets/landmark/trees.svg"});
		
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

function parse (content) {
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
	for (let i=1; i<lines.length; i++) {
		let values = lines[i].replace("\r","").replace("\n","").split("\t");
		let pathStr = values.splice(0, 1);
		let path = parseHierarchy(pathStr);
		if (path.type==PATH_TYPE_ITEM) {
			breadcrumb[path.depth+1] = new Preset(values).appendNodeTo(breadcrumb[path.depth]);
		}
		 else {
		 	breadcrumb[path.depth+1] = new Group(values).appendNodeTo(breadcrumb[path.depth]);
		 }
	}
	return xml;
}

(function(){
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
			let xml = parse(content);
			fs.writeFileSync(outFile, xml.end({pretty:true}));
		}, 
		function(err){
			console.log("Error " + err);});
})();