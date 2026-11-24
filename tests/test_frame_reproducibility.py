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
    def test_render_frame_deterministic_pixel_match(self):
        """Verifies that rendering the exact same (slideIdx, timeMs) twice yields 100% identical pixel buffer."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.goto("http://localhost:8090/static/index.html")
            page.wait_for_selector("#stage_canvas", state="attached")

            # Reveal animation section & load presentation
            page.evaluate("""(data) => {
                document.getElementById('animation_section').style.display = 'flex';
                window.PRESENTATION_PLAYER.init();
                window.PRESENTATION_PLAYER.loadPresentation(data);
                window.PRESENTATION_PLAYER.isPlaying = false;
            }""", SAMPLE_PRESENTATION)

            # Test multiple timestamps: 1000ms (Perform phase), 3200ms (Settle phase)
            for test_ms in [1000, 3200]:
                # Render pass 1
                img1_data = page.evaluate(f"""() => {{
                    window.PRESENTATION_PLAYER.renderFrame(0, {test_ms});
                    return document.getElementById('stage_canvas').toDataURL('image/png');
                }}""")

                # Do something else in between
                page.evaluate("() => { window.PRESENTATION_PLAYER.renderFrame(1, 2000); }")

                # Render pass 2 with identical arguments
                img2_data = page.evaluate(f"""() => {{
                    window.PRESENTATION_PLAYER.renderFrame(0, {test_ms});
                    return document.getElementById('stage_canvas').toDataURL('image/png');
                }}""")

                self.assertEqual(img1_data, img2_data, f"Frame rendered at timeMs={test_ms} must be 100% byte-for-byte identical")

            browser.close()

if __name__ == '__main__':
    unittest.main()
