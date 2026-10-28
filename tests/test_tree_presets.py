"""Regression checks using only Python's standard library and the generator's Node dependency."""
import csv
import re
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = {'p': 'http://josm.openstreetmap.de/tagging-preset-1.0'}


class TreePresetsTest(unittest.TestCase):
    def generate(self, content):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'input.tsv'
            output = Path(directory) / 'output.xml'
            source.write_text(content)
            subprocess.run(['node', str(ROOT / 'JOSM_tree_preset_gen.js'),
                            str(source), str(output)], check=True, capture_output=True)
            return ET.parse(output).getroot()

    def test_regional_data_and_reordered_columns(self):
        for region in ('japan', 'okinawa', 'east_asia'):
            content = (ROOT / 'tsv' / (region + '.tsv')).read_text()
            rows = list(csv.reader(content.splitlines(), delimiter='\t'))
            headers = [re.sub(r'\s*\(.*\)$', '', name.strip()) for name in rows[0]]
            expected = [dict(zip(headers, row)) for row in rows[1:]
                        if row and row[0].strip() == '-']
            # Also ensure column order, BOM, CRLF, and trailing blank lines are harmless.
            reordered = '\ufeff' + '\r\n'.join('\t'.join(reversed(
                row + [''] * (len(headers) - len(row)))) for row in rows if row) + '\r\n\r\n'
            for source in (content, reordered):
                with self.subTest(region=region, reordered=source == reordered):
                    root = self.generate(source)
                    items = root.findall('.//p:item', NS)
                    self.assertEqual(len(items), len(expected))
                    for item, row in zip(items, expected):
                        self.assertEqual(item.get('name'), row['プリセット/名/グループ名'])
                        keys = {key.get('key'): key.get('value') for key in item.findall('p:key', NS)}
                        for name in ('leaf_type', 'genus', 'species', 'species:ja',
                                     'species:en', 'species:ko', 'taxon', 'leaf_cycle'):
                            value = row.get(name, '')
                            if name in ('leaf_type', 'leaf_cycle'):
                                value = re.sub(r' \(.*\)', '', value)
                            self.assertEqual(keys.get(name, ''), value, (item.get('name'), name))
                        self.assertEqual(item.find("p:combo[@key='sex']", NS) is not None,
                                         row.get('sex') == 'yes')
                        links = [link.get('href') for link in item.findall('p:link', NS)]
                        self.assertEqual(links, ['https://www.wikidata.org/wiki/' + row['Wikidata ID']]
                                         if row.get('Wikidata ID') else [])
                        korean = row.get('韓国語名', '')
                        self.assertEqual(item.get('ko.name', ''), korean)
                        self.assertEqual(item.find('p:label', NS).get('ko.text', ''), korean)

    def test_missing_required_header_fails(self):
        content = (ROOT / 'tsv' / 'east_asia.tsv').read_text()
        with self.assertRaises(subprocess.CalledProcessError):
            self.generate(content.replace('leaf_cycle (葉の季節変化)', 'unknown', 1))


if __name__ == '__main__':
    unittest.main()
