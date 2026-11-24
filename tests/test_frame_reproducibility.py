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
                    "duration_ms": 5400,
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
                    "duration_ms": 5400,
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
                    "duration_ms": 5400,
                    "action_type": "gavel_verdict",
                    "action_payload": {
                        "court_name": "SUPREME COURT OF INDIA",
                        "case_citation": "Hadley v. Baxendale Principle",
                        "ratio": "Only natural and proximate damages naturally arising from breach are recoverable."
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Breach Block",
            "layout_archetype": "layout_hero_stage",
            "layout_payload": {
                "hero_headline": "Statutory Default Evaluation"
            },
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "Default in statutory compliance imposes strict liability.",
                    "line_title": "Default Triggered",
                    "duration_ms": 5400,
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "Statutory Non-Compliance",
                        "cause": "Failure to File Prescribed Return",
                        "consequence": "Late Fee & Statutory Interest Levied"
                    }
                }
            ]
        },
        {
            "id": 5,
            "tab_title": "5. Financial Meter",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "min_val": 0,
                        "max_val": 10000000,
                        "current_val": 7500000,
                        "threshold": 5000000
                    }
                }
            ]
        },
        {
            "id": 6,
            "tab_title": "6. Clock Limitation",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "clock_limitation",
                    "action_payload": {
                        "deadline": "3 Years",
                        "is_barred": False
                    }
                }
            ]
        },
        {
            "id": 7,
            "tab_title": "7. Property Transfer",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "property_transfer",
                    "action_payload": {
                        "property_desc": "Commercial Asset",
                        "status": "MUTATED"
                    }
                }
            ]
        },
        {
            "id": 8,
            "tab_title": "8. Condition Checklist",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "condition_checklist",
                    "action_payload": {
                        "conditions": [
                            {"text": "Condition 1", "satisfied": True},
                            {"text": "Condition 2", "satisfied": True}
                        ]
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
        cls.page.evaluate("""async (data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
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
        # Test pilot, batch 1, and batch 2 engines (all 8 slides)
        for slide_idx in range(len(SAMPLE_PRESENTATION["scenes"])):
            # 65% of 5400ms is 3510ms, 100% is 5400ms
            img_stage_65 = self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 3510);
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

            img_stage_100 = self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 5400);
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
                f"Slide {slide_idx}: mainStageRegion at 65% (3510ms) and 100% (5400ms) must be 100% pixel-identical"
            )

    def test_speed_change_continuity(self):
        """Requirement 1: Changing speed mid-line keeps frame continuous and does not jump line index."""
        result = self.page.evaluate("""() => {
            const player = window.PRESENTATION_PLAYER;
            player.switchSlide(0);
            player.currentTimeMs = 2700; // mid-line at 50%
            player.setSpeed(1.0);
            player.render();

            const img_before = document.getElementById('stage_canvas').toDataURL('image/png');
            const lineIdx_before = player.currentSlideIdx;
            const time_before = player.currentTimeMs;

            // Change speed to 1.25x mid-line
            player.setSpeed(1.25);
            player.render();

            const img_after = document.getElementById('stage_canvas').toDataURL('image/png');
            const lineIdx_after = player.currentSlideIdx;
            const time_after = player.currentTimeMs;

            return {
                img_equal: img_before === img_after,
                lineIdx_before,
                lineIdx_after,
                time_before,
                time_after,
                speed: player.playbackSpeed
            };
        }""")

        self.assertTrue(result["img_equal"], "Changing speed mid-line must produce identical frame at that instant")
        self.assertEqual(result["lineIdx_before"], result["lineIdx_after"], "Line index must not jump on speed change")
        self.assertEqual(result["time_before"], result["time_after"], "Timeline currentTimeMs must remain continuous")
        self.assertEqual(result["speed"], 1.25, "Playback speed should be set to 1.25")

if __name__ == '__main__':
    unittest.main()
