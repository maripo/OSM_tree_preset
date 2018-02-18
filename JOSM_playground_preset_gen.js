/**
	JOSM_playground_preset_gen.js
	Yet Another Playground Preset Generator for JOSM
	for Node.js v6 or later
	
	Author: Maripo GODA
*/

const pg = require("./JOSM_preset_gen.js");

const COLUMNS = [
	new pg.FieldRootAttr("name"),
	new pg.FieldText("playground")
];

(function(){
	
	let conf = {
		preset_attrs : {
			author : "Maripo GODA and contributors",
			description : "公園の子供用遊具のプリセットです",
			shortdescription : "公園の遊具"
		},
		columns: COLUMNS,
		add_chunks : function (xml) {
			// Default fields
			let chunk = xml.ele("chunk",{"id":"playground_common"});
			chunk.ele("text",{ "key":"min_age", "text":"年齢下限 (歳)" });
			chunk.ele("text",{ "key":"max_age", "text":"年齢上限 (歳)" });
			chunk.ele("combo",{ "key":"material", "text":"材質", "values":"wood,metal,concrete,plastic" });
			chunk.ele("combo",{ "key":"wheelchair", "text":"車椅子", "values":"yes,no,limited" });
			chunk.ele("check", {"key":"baby", "text":"乳幼児向け"});
		},
		presetHeader: function (itemNode, values) {
			itemNode.att("icon", "presets/leisure/playground.svg");
			itemNode.ele("label", {"text":values[0]});
			itemNode.ele("text",{ "key":"name", "text":"名前" });
		
		},
		presetFooter: function (itemNode, values) {
			itemNode.ele("reference", {"ref":"playground_common"});
		
		}
	};
	pg.generatePresets(conf);
})();