/**
	JOSM_tree_preset_gen.js
	Yet Another Tree Preset Generator for JOSM
	for Node.js v6 or later
	
	Author: Maripo GODA
*/

const pg = require("./JOSM_preset_gen.js");

const COLUMNS = [
	new pg.FieldRootAttr("name"),
	new pg.FieldAnnotatedText("leaf_type"),
	new pg.FieldText("genus"),
	new pg.FieldText("species"),
	new pg.FieldText("species:ja"),
	new pg.FieldText("species:en"),
	new pg.FieldText("taxon"),
	new pg.FieldCombo("sex", "雌雄", ["male","female"]),
	new pg.FieldAnnotatedText("leaf_cycle"),
	new pg.FieldLink()
];

function isNeedleleaved (values) {
	for (let i=0; i<values.length; i++) {
		if (values[i].indexOf("needleleaved")>=0) {
			return true;
		}
	}
	return false;
}
(function(){
	
	let conf = {
		name: "樹木",
		preset_attrs : {
			author : "Maripo GODA and contributors",
			description : "日本でよく見られる樹木のプリセットです",
			shortdescription : "日本の樹木"
		},
		columns: COLUMNS,
		add_chunks : function (xml) {
			// Default fields
			let chunk = xml.ele("chunk",{"id":"japan_trees"});
			chunk.ele("text",{ "key":"operator", "text":"運営者" });
			chunk.ele("text",{ "key":"ref", "text":"参照番号" });
			chunk.ele("text",{ "key":"height", "text":"高さ(m)" });
			chunk.ele("text",{ "key":"circumference", "text":"幹の外周(m)" });
			chunk.ele("combo", {"key":"denotation", "text":"特徴", "values":"landmark,natural_monument,avenue,urban"});
			chunk.ele("check", {"key":"monument", "text":"記念樹"});
		},
		presetHeader: function (itemNode, values) {
			
			itemNode.att("icon", isNeedleleaved(values)?"presets/landmark/trees_conifer.svg":"presets/landmark/trees.svg");
			itemNode.ele("label", {"text":values[0]});
			itemNode.ele("text",{ "key":"name", "text":"名前" });
		
		},
		presetFooter: function (itemNode, values) {
			itemNode.ele("reference", {"ref":"japan_trees"});
		
		}
	};
	pg.generatePresets(conf);
})();