/**
	JOSM_preset_gen.js
	Yet Another Preset Generator for JOSM
	for Node.js v6 or later
	
	Author: Maripo GODA
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
	appendNodeTo (parentNode, conf) {
		let columns = conf.columns;
		let presetName = this.values[0];
		let itemNode = parentNode.ele("item", {"name":presetName});
		
		if (conf.presetHeader) {
			conf.presetHeader(itemNode, this.values);
		}
		
		for (let i=0; i<Math.min(this.values.length, columns.length); i++) {
			columns[i].append(itemNode, this.values[i]);
		}
		if (conf.presetFooter) {
			conf.presetFooter(itemNode, this.values);
		}
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

function generateXML (content, conf) {
	let lines = content.split("\n");
	
	let xml = builder.create("presets");
	xml.att("xmlns","http://josm.openstreetmap.de/tagging-preset-1.0");
	if (conf.preset_attrs) {
		for (let key in conf.preset_attrs) {
			xml.att(key, conf.preset_attrs[key]);
		}
	}
	if (conf.add_chunks) {
		conf.add_chunks(xml);
	}
	
	
	// Container of all trees
	let group;
	if (conf.name) {
		group = xml.ele("group", {"name":conf.name});
	} else {
		group = xml;
	}
		 	
	let breadcrumb = [group];
	let depth = 0;
	for (let i=1; i<lines.length; i++) {
		let values = lines[i].replace("\r","").replace("\n","").split("\t");
		let pathStr = values.splice(0, 1);
		let path = parseHierarchy(pathStr);
		if (path.type==PATH_TYPE_ITEM) {
			breadcrumb[path.depth+1] = new Preset(values).appendNodeTo(breadcrumb[path.depth], conf);
		}
		 else {
		 	breadcrumb[path.depth+1] = new Group(values).appendNodeTo(breadcrumb[path.depth]);
		 }
	}
	return xml;
}
exports.generatePresets = function (conf) {
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
			let xml = generateXML(content, conf);
			fs.writeFileSync(outFile, xml.end({pretty:true}));
		}, 
		function(err){
			console.log("Error " + err);
		}
	);
}

exports.FieldRootAttr = class FieldRootAttr {
	constructor (key) {
		this.key = key;
	}
	append (node, value) {
		if (value && value.length) {
			node.att(this.key, value);
		}
	}
};


// Simple Key-value pair
exports.FieldText = class FieldText {
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
exports.FieldAnnotatedText = class FieldAnnotatedText {
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
exports.FieldCombo = class FieldCombo {
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

// TODO
exports.FieldLink = class FieldLink {
	constructor () {
	}
	append (node, value) {
		if (value && value.length > 0) {
			node.ele("link", {"href":"https://www.wikidata.org/wiki/" + value});
		}
	}
}
