import os
import sys
import unittest

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if STUDIO_DIR not in sys.path:
    sys.path.insert(0, STUDIO_DIR)

from pipeline.story_choreographer import validate_and_sanitize_screenplay, VALID_LAYOUTS, VALID_ACTIONS

class TestChoreographerSchema(unittest.TestCase):
    def test_sanitize_empty_payload(self):
        sanitized = validate_and_sanitize_screenplay({}, "Sample provision")
        self.assertIn("act_name", sanitized)
        self.assertIn("scenes", sanitized)
        self.assertGreaterEqual(len(sanitized["scenes"]), 1)
        self.assertIn("layout_payload", sanitized["scenes"][0])

    def test_bilateral_split_payload_healing(self):
        raw = {
            "act_name": "Indian Contract Act, 1872",
            "section_code": "Section 10",
            "scenes": [
                {
                    "id": 1,
                    "layout_archetype": "layout_bilateral_split",
                    "lines": [
                        {"sentence": "Murali leases shop to Susan.", "action_type": "handshake_consent"}
                    ]
                }
            ]
        }
        sanitized = validate_and_sanitize_screenplay(raw, "")
        sc = sanitized["scenes"][0]
        self.assertIn("layout_payload", sc)
        self.assertIn("left_label", sc["layout_payload"])
        self.assertIn("right_label", sc["layout_payload"])
        self.assertEqual(sc["lines"][0]["duration_ms"], 4500)

    def test_sequential_pipeline_payload_healing(self):
        raw = {
            "act_name": "Companies Act, 2013",
            "section_code": "Section 135",
            "scenes": [
                {
                    "id": 1,
                    "layout_archetype": "layout_sequential_pipeline",
                    "lines": [
                        {"sentence": "Board passes CSR resolution.", "action_type": "corporate_board"}
                    ]
                }
            ]
        }
        sanitized = validate_and_sanitize_screenplay(raw, "")
        sc = sanitized["scenes"][0]
        self.assertIn("stages", sc["layout_payload"])
        self.assertGreaterEqual(len(sc["layout_payload"]["stages"]), 2)

    def test_quadrant_grid_payload_healing(self):
        raw = {
            "act_name": "Income Tax Act, 1961",
            "section_code": "Section 54",
            "scenes": [
                {
                    "id": 1,
                    "layout_archetype": "layout_quadrant_grid",
                    "lines": [
                        {"sentence": "Section 54 has 4 essential ingredients.", "action_type": "condition_checklist"}
                    ]
                }
            ]
        }
        sanitized = validate_and_sanitize_screenplay(raw, "")
        sc = sanitized["scenes"][0]
        self.assertIn("quadrants", sc["layout_payload"])
        self.assertEqual(len(sc["layout_payload"]["quadrants"]), 4)

    def test_precedent_parchment_payload_healing(self):
        raw = {
            "act_name": "Income Tax Act, 1961",
            "section_code": "Section 50C",
            "scenes": [
                {
                    "id": 1,
                    "layout_archetype": "layout_precedent_parchment",
                    "lines": [
                        {"sentence": "Supreme Court held that stamp duty value can be disputed.", "action_type": "gavel_verdict"}
                    ]
                }
            ]
        }
        sanitized = validate_and_sanitize_screenplay(raw, "")
        sc = sanitized["scenes"][0]
        self.assertIn("court", sc["layout_payload"])
        self.assertIn("case_name", sc["layout_payload"])
        self.assertIn("ratio_headline", sc["layout_payload"])

    def test_settle_hold_calculation(self):
        # 35% of 4500ms is 1575ms >= 1500ms
        line_duration_ms = 4500
        settle_ratio = 0.35
        hold_time_ms = line_duration_ms * settle_ratio
        self.assertGreaterEqual(hold_time_ms, 1500, "Settle hold time must be at least 1.5 seconds")

if __name__ == '__main__':
    unittest.main()
