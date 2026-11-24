import os
import sys
import unittest
from playwright.sync_api import sync_playwright

SAMPLE_PRESENTATION = {
    "act_name": "Indian Contract Act, 1872",
    "section_code": "Section 10 & Section 73",
    "core_doctrine": "Enforceability & Quantum of Damages",
    "story_summary": "Factual deconstruction of consideration, damages scale, and judicial ruling.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Money Transfer (Consideration)",
            "layout_archetype": "layout_bilateral_split",
            "layout_payload": {
                "left_label": "Mr. Murali (Promisor)",
                "left_role": "Tenant / Lessee",
                "right_label": "Dr. Susan (Promisee)",
                "right_role": "Landlord / Lessor"
            },
            "dialogue": "Mr. Murali remits the agreed monthly consideration of Rs 50,000 to Dr. Susan.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "Mr. Murali remits the agreed monthly consideration of Rs 50,000 to Dr. Susan.",
                    "line_title": "Payment of Consideration",
                    "duration_ms": 4500,
                    "action_type": "money_transfer",
                    "action_payload": {
                        "from_actor": "Mr. Murali",
                        "to_actor": "Dr. Susan",
                        "amount": "₹50,000",
                        "description": "Monthly Lease Rent"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Balance Scale (Weighing Losses)",
            "layout_archetype": "layout_hero_stage",
            "layout_payload": {
                "hero_headline": "Direct vs Remote Losses Under Section 73",
                "focal_element": "Balance of Claims"
            },
            "dialogue": "The court weighs direct natural damages against remote consequential losses.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "The court weighs direct natural damages against remote consequential losses.",
                    "line_title": "Assessment of Recoverable Damages",
                    "duration_ms": 4500,
                    "action_type": "balance_scale",
                    "action_payload": {
                        "left_weight": "Ordinary Direct Loss",
                        "left_amount": "₹1,50,000",
                        "right_weight": "Remote Special Loss",
                        "right_amount": "₹10,00,000",
                        "verdict": "Scale Tilts: Only Natural Loss Allowed"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Gavel Verdict (Judicial Precedent)",
            "layout_archetype": "layout_precedent_parchment",
            "layout_payload": {
                "court": "SUPREME COURT OF INDIA",
                "case_name": "Hadley v. Baxendale (Applicable Principle)",
                "year": "2024",
                "ratio_headline": "Remote Damages Without Special Notice are Inadmissible"
            },
            "dialogue": "The court pronounces the binding legal ratio governing statutory breach.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "The court pronounces the binding legal ratio governing statutory breach.",
                    "line_title": "Ratio Decidendi Pronounced",
                    "duration_ms": 4500,
                    "action_type": "gavel_verdict",
                    "action_payload": {
                        "court_name": "SUPREME COURT OF INDIA",
                        "case_citation": "Hadley v. Baxendale Principle",
                        "ratio": "Only natural and proximate damages naturally arising from breach are recoverable."
                    }
                }
            ]
        }
    ]
}

class TestFrameReproducibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)
        cls.page = cls.browser.new_page(viewport={"width": 1280, "height": 800})
        cls.page.goto("http://localhost:8090/static/index.html")
        cls.page.wait_for_selector("#stage_canvas", state="attached")
        cls.page.evaluate("""(data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;
        }""", SAMPLE_PRESENTATION)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_scrub_order_independence_aba(self):
        """Requirement 1: Renders frame A, then B, then A again and asserts A is pixel-identical both times."""
        # Frame A: slide 0 at 1200ms
        img_A1 = self.page.evaluate("""() => {
            window.PRESENTATION_PLAYER.renderFrame(0, 1200);
            return document.getElementById('stage_canvas').toDataURL('image/png');
        }""")

        # Frame B: slide 0 at 3600ms
        self.page.evaluate("""() => {
            window.PRESENTATION_PLAYER.renderFrame(0, 3600);
        }""")

        # Frame A again: slide 0 at 1200ms
        img_A2 = self.page.evaluate("""() => {
            window.PRESENTATION_PLAYER.renderFrame(0, 1200);
            return document.getElementById('stage_canvas').toDataURL('image/png');
        }""")

        self.assertEqual(img_A1, img_A2, "Scrubbing backwards to Frame A must yield 100% pixel-identical buffer")

    def test_settle_hold_65_and_100_pixel_identical(self):
        """Requirement 2: The 65% and 100% frames are pixel-identical inside mainStageRegion (excluding progress dots)."""
        # For all 3 pilot engines (slide 0, 1, 2)
        for slide_idx in [0, 1, 2]:
            # Extract mainStageRegion pixels (x: 48, y: 96, w: 1184, h: 480)
            img_stage_65 = self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 2925); // 65% of 4500ms
                const canvas = document.getElementById('stage_canvas');
                const ctx = canvas.getContext('2d');
                // Create sub-canvas for mainStageRegion
                const sub = document.createElement('canvas');
                sub.width = 1184; sub.height = 480;
                const sctx = sub.getContext('2d');
                // Scale ratio between canvas backing store and 1280x720
                const sx = canvas.width / 1280;
                const sy = canvas.height / 720;
                sctx.drawImage(canvas, 48 * sx, 96 * sy, 1184 * sx, 480 * sy, 0, 0, 1184, 480);
                return sub.toDataURL('image/png');
            }}""")

            img_stage_100 = self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 4500); // 100% of 4500ms
                const canvas = document.getElementById('stage_canvas');
                const ctx = canvas.getContext('2d');
                const sub = document.createElement('canvas');
                sub.width = 1184; sub.height = 480;
                const sctx = sub.getContext('2d');
                const sx = canvas.width / 1280;
                const sy = canvas.height / 720;
                sctx.drawImage(canvas, 48 * sx, 96 * sy, 1184 * sx, 480 * sy, 0, 0, 1184, 480);
                return sub.toDataURL('image/png');
            }}""")

            self.assertEqual(
                img_stage_65,
                img_stage_100,
                f"Slide {slide_idx}: mainStageRegion at 65% (2925ms) and 100% (4500ms) must be 100% pixel-identical"
            )

if __name__ == '__main__':
    unittest.main()
