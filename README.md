# JOSM用 東アジアの樹木プリセット(仮)

OpenStreetMap用のエディタJOSMで使える樹木のプリセットを作っています。学名や葉の種類などなど、毎回調べるのがたいへんなので作りました。
樹木・生け垣・並木など色々な場面で使えるよう、基本的に「樹木の種類」を補完する方針で作っています。 natural=tree など他のタグは別個に入れてください。

当初「日本の樹木」プリセットとして作成しましたが、植生の似ている東アジア全般で使えるよう樹種・対応言語を広げました。

XMLを手で打つのはとてもたいへんなので、

- 一覧性のある[スプレッドシート](https://docs.google.com/spreadsheets/d/1DRhRnFOnIq7Wdb4OhTd7zIIFfKHVGm_kbLSh-fjYabY/)で編集
- TSVをダウンロード
- JOSMプリセットファイル (XML) を生成

という流れで生成しています。

## JOSMに入れて使ってみたい

- XMLファイルをダウンロードします
	- 東京版 [https://raw.githubusercontent.com/maripo/OSM_tree_preset/master/presets/japan.xml](https://raw.githubusercontent.com/maripo/OSM_tree_preset/master/presets/japan.xml)
	- 沖縄版 [https://raw.githubusercontent.com/maripo/OSM_tree_preset/master/presets/okinawa.xml](https://raw.githubusercontent.com/maripo/OSM_tree_preset/master/presets/okinawa.xml)
- "プリセット > プリセット設定" または "Preferences... > マップ設定 > タグ付けプリセット" でプリセットタブを開き、右上の "+" アイコンをクリックします。
"URL / ファイル名" でファイルを指定すると使えるようになります。

## 編集したい

今のところスプレッドシートは誰でも編集できるようにしています。まだサポートしている樹種が足りないので「使いそう」と思った樹木があったら調べて入れてください。
いたずらされたり修正が必要になったりしたらちょっといじるかもしれません。更新があったら時々ファイルを生成しなおします。

- https://docs.google.com/spreadsheets/d/1DRhRnFOnIq7Wdb4OhTd7zIIFfKHVGm_kbLSh-fjYabY/

Facebookで有志の方が作ってくださった沖縄編のデータです。こちらは readonly っぽいです。

- https://docs.google.com/spreadsheets/d/1VHpA0TkoLqhM3QFx9kJ2uchkXc1Lkd8koPZb6vgG84Q/

## 生成してみたい!

生成プログラムは Node.js で書かれています。"xmlbuilder" モジュール使ってます。必要なモジュールや実行環境は用意してください。

1. TSV形式でダウンロードしてローカル保存
2. コマンドラインで "node JOSM_tree_preset_gen.js <TSVファイルのパス> <プリセットXMLファイルのパス>" を実行
3. できたXMLファイルを上記の方法でJOSMに取り込む (一度登録したら、JOSMを起動するたびにローカルのファイルが読み直されます)

## スクリーンショット

![メニューから](https://github.com/maripo/OSM_tree_preset/blob/master/doc/img/screenshot_menu.png)

![ダイアログ](https://github.com/maripo/OSM_tree_preset/blob/master/doc/img/screenshot_dialog.png)

## メモ

- 山岳用など植生の異なるものも作れるといいかも
- 植生の似ている日本以外でも使えるように、多言語対応しやすくしたい
	- 韓国も植生が似ているらしいので充実してきたら韓国語のカラムも追加するといいかも?
- アイコンがほしい
	- 現在すべてJOSMの木アイコン
	- 針葉樹・広葉樹の別だけでもつけるといいかも
	- お花のアイコンがほしい!
- WikidataやWikispeciesをクローリングして生成するのもいいかも
- リンク先がWikidataになっているけれどわかりにくいからWikipediaに飛ばしてほしいという人もいるかも?

## 作ってる人

ごうだまりぽ (OSM:maripogoda, Twitter:MaripoGoda)
