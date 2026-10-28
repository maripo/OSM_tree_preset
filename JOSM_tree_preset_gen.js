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
	new pg.FieldText("species:ko"),
	new pg.FieldText("taxon"),
	new pg.FieldCombo("sex", "雌雄", ["male","female"], "성별"),
	new pg.FieldAnnotatedText("leaf_cycle"),
	new pg.FieldLink()
];

// Resolve columns by header: regional TSVs have different optional columns.
const HEADERS = [
	"プリセット/名/グループ名", "leaf_type", "genus", "species",
	"species:ja", "species:en", "species:ko", "taxon", "sex",
	"leaf_cycle", "Wikidata ID", "韓国語名"
];
function prepareRows(headers) {
	const names = headers.map(header => header.trim().replace(/\s*\(.*\)$/, ""));
	const indices = HEADERS.map(name => names.indexOf(name));
	["階層", "プリセット/名/グループ名", "leaf_type", "genus", "species",
	 "species:ja", "species:en", "taxon", "sex", "leaf_cycle"].forEach(name => {
		if (names.indexOf(name) < 0) {
			throw new Error("Missing TSV column: " + name);
		}
	});
	return values => [values[names.indexOf("階層")]].concat(
		indices.map(index => index < 0 ? "" : (values[index] || ""))
	);
}

function isNeedleleaved (values) {
	for (let i=0; i<values.length; i++) {
		if (values[i].indexOf("needleleaved")>=0) {
			return true;
		}
	}
	return false;
}
function formatDate(d = new Date()) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes())
  );
}

(function(){

	let conf = {
		name: "樹木",
		nameKo: "수목",
		preset_attrs : {
			author : "Maripo GODA and contributors",
			description : "東アジアでよく見られる樹木のプリセットです",
			shortdescription : "東アジアの樹木",
			"ko.description": "일본에서 자주 볼 수 있는 수목 프리셋입니다",
			"ko.shortdescription": "일본의 수목",
			version: formatDate(new Date(), "yyyymmddHHMM")
		},
		columns: COLUMNS,
		prepareRows: prepareRows,
		add_chunks : function (xml) {
			// Default fields
			let chunk = xml.ele("chunk",{"id":"japan_trees"});
			chunk.ele("text",{ "key":"operator", "text":"運営者", "ko.text":"관리자" });
			chunk.ele("text",{ "key":"ref", "text":"参照番号", "ko.text":"참조 번호" });
			chunk.ele("text",{ "key":"height", "text":"高さ(m)", "ko.text":"높이(m)" });
			chunk.ele("text",{ "key":"circumference", "text":"幹の外周(m)", "ko.text":"줄기 둘레(m)" });
			chunk.ele("combo", {"key":"denotation", "text":"特徴", "ko.text":"특징", "values":"landmark,natural_monument,avenue,urban", "ko.display_values":"랜드마크,자연유산,거리,도시"});
			chunk.ele("check", {"key":"monument", "text":"記念樹", "ko.text":"기념수"});
		},
		presetHeader: function (itemNode, values) {

			itemNode.att("icon", isNeedleleaved(values)?"presets/landmark/trees_conifer.svg":"presets/landmark/trees.svg");
			const label = itemNode.ele("label", {"text":values[0]});
			if (values[11]) label.att("ko.text", values[11]);
			itemNode.ele("text",{ "key":"name", "text":"名前", "ko.text":"이름" });

		},
		presetFooter: function (itemNode, values) {
			itemNode.ele("reference", {"ref":"japan_trees"});

		}
	};
	pg.generatePresets(conf);
})();
