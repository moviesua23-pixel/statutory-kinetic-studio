import unittest
from playwright.sync_api import sync_playwright
from pipeline.story_choreographer import (
    extract_monetary_amount_from_sentence,
    infer_direction_from_sentence,
    validate_and_sanitize_screenplay
)

class TestDataFidelity(unittest.TestCase):
    """
    Requirement 4 & 5:
    Data Fidelity & Extraction Tests:
    - Multiple numbers in a sentence
    - Lakhs and Crores forms ('₹2 Lakhs', '₹1.5 Crore', '₹75,00,000')
    - Percentages (e.g. '18%', '50%') and calendar years (e.g. '2024', '1872') that must NOT be picked as amounts
    - Model's value is authoritative (not overwritten by regex)
    - Fallback gap-filling when model omits numeric_value
    - Canvas verification: formatted number appears on stage
    """

    def test_amount_extraction_edge_cases(self):
        """Tests that regex extracts amounts correctly and ignores years/percentages."""
        # 1. Lakh form
        s1 = "Under the 2024 amendment, a 50% penalty on ₹2 Lakhs is levied."
        self.assertEqual(extract_monetary_amount_from_sentence(s1), 200000)

        # 2. Crore form
        s2 = "In Financial Year 2023-24, total business turnover exceeded ₹1.5 Crore."
        self.assertEqual(extract_monetary_amount_from_sentence(s2), 15000000)

        # 3. Comma-separated currency amount with multiple numbers, section, and year
        s3 = "Under Section 73 of the 1872 Act, the plaintiff suffered a quantified loss of ₹2,00,000 due to breach."
        self.assertEqual(extract_monetary_amount_from_sentence(s3), 200000)

        # 4. Sentence with percentages and years only (no monetary amount)
        s4 = "Under Section 50 of the 2017 Act, interest at 18% per annum is payable for delay of 30 days."
        self.assertIsNone(extract_monetary_amount_from_sentence(s4), "Must not pick 18%, 2017, or 30 days as amount")

        # 5. Sentence with Lakhs without currency symbol
        s5 = "The assessing officer determined a statutory deficit of 10 Lakhs."
        self.assertEqual(extract_monetary_amount_from_sentence(s5), 1000000)

        # 6. Direction inference
        self.assertEqual(infer_direction_from_sentence("The buyer incurred a net quantified loss of ₹2,00,000."), "loss")
        self.assertEqual(infer_direction_from_sentence("The company claimed an allowable input tax credit of ₹75,000."), "gain")
        self.assertEqual(infer_direction_from_sentence("Aggregate turnover threshold limit of ₹40 Lakhs was crossed."), "threshold")

    def test_model_value_is_authoritative(self):
        """Tests that when model provides numeric_value, it is never overwritten by regex."""
        raw_screenplay = {
            "act_name": "Indian Contract Act, 1872",
            "section_code": "Section 73",
            "core_doctrine": "Compensation for Loss or Damage Caused by Breach",
            "scenes": [
                {
                    "id": 1,
                    "lines": [
                        {
                            "line_num": 1,
                            "sentence": "The court assessed a quantified loss of ₹2,00,000 on breach.",
                            "action_type": "financial_meter",
                            "action_payload": {
                                "title": "Model Authoritative Assessment",
                                "numeric_value": 350000, # Model explicitly specified 350,000
                                "max_value": 700000,
                                "direction": "loss"
                            }
                        }
                    ]
                }
            ]
        }
        sanitized = validate_and_sanitize_screenplay(raw_screenplay, "")
        pld = sanitized["scenes"][0]["lines"][0]["action_payload"]
        self.assertEqual(pld["numeric_value"], 350000, "Model's value must be authoritative and preserved!")

    def test_gap_filling_when_model_omits_numeric_value(self):
        """Tests that when model omits numeric_value, validator fills the gap from the sentence."""
        raw_screenplay = {
            "act_name": "Indian Contract Act, 1872",
            "section_code": "Section 73",
            "core_doctrine": "Compensation for Loss or Damage Caused by Breach",
            "scenes": [
                {
                    "id": 1,
                    "lines": [
                        {
                            "line_num": 1,
                            "sentence": "The court assessed a quantified loss of ₹2,00,000 on breach under the 2024 precedent.",
                            "action_type": "financial_meter",
                            "action_payload": {
                                "title": "Quantified Loss Assessment"
                                # numeric_value missing!
                            }
                        }
                    ]
                }
            ]
        }
        sanitized = validate_and_sanitize_screenplay(raw_screenplay, "")
        pld = sanitized["scenes"][0]["lines"][0]["action_payload"]
        self.assertEqual(pld["numeric_value"], 200000, "Validator must extract ₹2,00,000 to fill the gap")
        self.assertEqual(pld["direction"], "loss", "Validator must infer 'loss' from sentence")
        self.assertGreaterEqual(pld["max_value"], 300000, "Validator must set reasonable max_value")

    def test_canvas_data_fidelity_in_browser(self):
        """Tests that when payload contains a number, it actually appears in Canvas fillText on stage."""
        test_presentation = {
            "act_name": "Indian Contract Act, 1872",
            "section_code": "Section 73",
            "core_doctrine": "Compensation for Loss",
            "scenes": [
                {
                    "id": 1,
                    "tab_title": "1. Loss Meter",
                    "layout_archetype": "layout_hero_stage",
                    "lines": [
                        {
                            "line_num": 1,
                            "sentence": "The court assessed a quantified loss of ₹2,00,000 on breach.",
                            "action_type": "financial_meter",
                            "action_payload": {
                                "title": "Quantified Loss Assessment",
                                "numeric_value": 200000,
                                "max_value": 500000,
                                "direction": "loss"
                            }
                        }
                    ]
                },
                {
                    "id": 2,
                    "tab_title": "2. Penalty Demand",
                    "layout_archetype": "layout_hero_stage",
                    "lines": [
                        {
                            "line_num": 1,
                            "sentence": "The authority issued a penalty demand of ₹75,00,000.",
                            "action_type": "penalty_fine",
                            "action_payload": {
                                "penalty_title": "Statutory Penalty Demand",
                                "total_amount": "₹75,00,000",
                                "numeric_value": 7500000
                            }
                        }
                    ]
                }
            ]
        }

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.goto("http://localhost:8090/static/index.html")
            page.wait_for_selector("#stage_canvas", state="attached")
            page.evaluate("""async (data) => {
                document.getElementById('animation_section').style.display = 'flex';
                window.PRESENTATION_PLAYER.init();
                if (window.THEME) await window.THEME.ensureFontsLoaded();
                if (document.fonts) await document.fonts.ready;
                window.PRESENTATION_PLAYER.loadPresentation(data);
                window.PRESENTATION_PLAYER.isPlaying = false;
            }""", test_presentation)

            # Test Slide 0: financial_meter renders ₹ 2,00,000
            texts_slide0 = page.evaluate("""() => {
                const texts = [];
                const origFillText = CanvasRenderingContext2D.prototype.fillText;
                CanvasRenderingContext2D.prototype.fillText = function(text, x, y) {
                    if (text !== undefined && text !== null) texts.push(String(text));
                    return origFillText.apply(this, arguments);
                };
                try {
                    window.PRESENTATION_PLAYER.renderFrame(0, 5400);
                } finally {
                    CanvasRenderingContext2D.prototype.fillText = origFillText;
                }
                return texts;
            }""")
            joined_0 = " ".join(texts_slide0)
            self.assertTrue(
                "2,00,000" in joined_0 or "200,000" in joined_0,
                f"Financial meter must draw the formatted number 2,00,000 on canvas! Rendered texts: {joined_0}"
            )

            # Test Slide 1: penalty_fine renders ₹75,00,000
            texts_slide1 = page.evaluate("""() => {
                const texts = [];
                const origFillText = CanvasRenderingContext2D.prototype.fillText;
                CanvasRenderingContext2D.prototype.fillText = function(text, x, y) {
                    if (text !== undefined && text !== null) texts.push(String(text));
                    return origFillText.apply(this, arguments);
                };
                try {
                    window.PRESENTATION_PLAYER.renderFrame(1, 5400);
                } finally {
                    CanvasRenderingContext2D.prototype.fillText = origFillText;
                }
                return texts;
            }""")
            joined_1 = " ".join(texts_slide1)
            self.assertTrue(
                "75,00,000" in joined_1,
                f"Penalty fine must draw ₹75,00,000 on canvas! Rendered texts: {joined_1}"
            )

            browser.close()

if __name__ == '__main__':
    unittest.main()
