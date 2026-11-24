import os
import sys
import json
import unittest

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if STUDIO_DIR not in sys.path:
    sys.path.insert(0, STUDIO_DIR)

from pipeline.timing_aligner import split_sentences_smart, analyze_audio_sentence_timings, synchronize_scene_elements

class TestStatutoryPipeline(unittest.TestCase):
    def test_split_sentences_preserves_tax_abbreviations(self):
        text = "Mr. Murali transferred property on 1st April 2024. Assessing Officer invoked Sec. 50C of Income Tax Act. He cited CIT vs. Ananda Basappa."
        sentences = split_sentences_smart(text)
        self.assertEqual(len(sentences), 3)
        self.assertIn("Mr. Murali", sentences[0])
        self.assertIn("Sec. 50C", sentences[1])
        self.assertIn("CIT vs. Ananda Basappa", sentences[2])

    def test_analyze_audio_sentence_timings(self):
        dialogue = "First sentence introduces the residential penthouse. Second sentence deconstructs Section 50C deemed consideration."
        dur_ms = 10000
        timings = analyze_audio_sentence_timings(audio_path="", dialogue=dialogue, total_duration_ms=dur_ms)
        self.assertEqual(len(timings), 2)
        self.assertGreaterEqual(timings[0]["start_ms"], 100)
        self.assertLessEqual(timings[0]["end_ms"], timings[1]["start_ms"] + 100)
        self.assertLessEqual(timings[1]["end_ms"], dur_ms)

    def test_synchronize_scene_elements(self):
        scene = {
            "id": 1,
            "layout_archetype": "split_screen",
            "elements": [
                {"id": "seller", "type": "asset_node", "amount_val": 10000000},
                {"id": "buyer", "type": "asset_node", "amount_val": 10000000}
            ]
        }
        sentences = [
            {"text": "Sentence 1", "start_ms": 500, "end_ms": 4000},
            {"text": "Sentence 2", "start_ms": 4100, "end_ms": 8000}
        ]
        synced = synchronize_scene_elements(scene, sentences, total_duration_ms=8500)
        self.assertIn("sentences", synced)
        self.assertLessEqual(synced["elements"][0]["start_ms"], 500)
        self.assertLessEqual(synced["elements"][1]["start_ms"], 4100)
        self.assertIn("countdown_trigger_ms", synced["elements"][0])

    def test_preset_provisions_integrity(self):
        presets_path = os.path.join(STUDIO_DIR, "static", "data", "preset_provisions.json")
        self.assertTrue(os.path.exists(presets_path))
        with open(presets_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertIn("50c_sdv", data)
        self.assertIn("45_2_conversion", data)
        self.assertIn("54_two_flats", data)
        self.assertIn("54ec_bonds", data)
        self.assertIn("gst_16_2_itc", data)
        for k, v in data.items():
            self.assertIn("text", v)
            self.assertIn("title", v)

if __name__ == '__main__':
    unittest.main()
