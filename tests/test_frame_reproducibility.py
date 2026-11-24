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
            "tab_title": "5. Contract Sign",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "contract_sign",
                    "action_payload": {
                        "title": "Registered Conveyance Deed",
                        "parties": "First Party & Second Party",
                        "key_term": "Transfer of Legal Title and Possession",
                        "stamp_text": "SIGNED & REGISTERED"
                    }
                }
            ]
        },
        {
            "id": 6,
            "tab_title": "6. Handshake Consent",
            "layout_archetype": "layout_bilateral_split",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "handshake_consent",
                    "action_payload": {
                        "party_a": "Promisor Entity",
                        "party_b": "Promisee Entity",
                        "consent_rule": "Mutual Consent and Consideration",
                        "status": "Binding Accord Reached"
                    }
                }
            ]
        },
        {
            "id": 7,
            "tab_title": "7. Goods Transport",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "goods_transport",
                    "action_payload": {
                        "origin": "Manufacturing Unit",
                        "destination": "Delivery Terminal",
                        "cargo": "Capital Machinery Consignment",
                        "delivery_status": "CONSIGNMENT DELIVERED"
                    }
                }
            ]
        },
        {
            "id": 8,
            "tab_title": "8. Financial Meter",
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
            "id": 9,
            "tab_title": "9. Clock Limitation",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "clock_limitation",
                    "action_payload": {
                        "deadline": "3 Years",
                        "elapsed": 2,
                        "limit": 3,
                        "is_barred": False
                    }
                }
            ]
        },
        {
            "id": 10,
            "tab_title": "10. Property Transfer",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "property_transfer",
                    "action_payload": {
                        "property_desc": "Commercial Asset",
                        "status": "TITLE CONVEYED"
                    }
                }
            ]
        },
        {
            "id": 11,
            "tab_title": "11. Condition Checklist",
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
        },
        {
            "id": 12,
            "tab_title": "12. Lock Security",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "lock_security",
                    "action_payload": {
                        "security_type": "Performance Bank Guarantee",
                        "amount": "₹25,00,000",
                        "obligor": "Contractor Entity",
                        "beneficiary": "Statutory Board",
                        "status": "STATUTORILY SECURED & ENFORCEABLE"
                    }
                }
            ]
        },
        {
            "id": 13,
            "tab_title": "13. Corporate Board",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "corporate_board",
                    "action_payload": {
                        "company_name": "Apex Corporation Ltd",
                        "resolution_title": "Special Resolution under Section 188",
                        "votes_for": 85,
                        "votes_against": 15,
                        "required_threshold": 75,
                        "status": "SPECIAL RESOLUTION DULY PASSED"
                    }
                }
            ]
        },
        {
            "id": 14,
            "tab_title": "14. Notice Dispatch",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "notice_dispatch",
                    "action_payload": {
                        "notice_title": "Statutory Show Cause Notice",
                        "sender": "Tax Authority",
                        "recipient": "Taxpayer Entity",
                        "dispatch_mode": "Speed Post with AD",
                        "status": "NOTICE DULY SERVED & ACKNOWLEDGED"
                    }
                }
            ]
        },
        {
            "id": 15,
            "tab_title": "15. Penalty Fine",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "penalty_fine",
                    "action_payload": {
                        "penalty_title": "Statutory Penalty Order",
                        "base_demand": "₹50,00,000",
                        "penalty_amount": "₹50,00,000",
                        "interest_amount": "₹9,00,000",
                        "total_amount": "₹1,09,00,000",
                        "status": "STATUTORY DEMAND ORDER CONFIRMED"
                    }
                }
            ]
        },
        {
            "id": 16,
            "tab_title": "16. Waterfall Flow",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "duration_ms": 5400,
                    "action_type": "waterfall_flow",
                    "action_payload": {
                        "waterfall_title": "IBC Section 53 Waterfall",
                        "realized_corpus": "₹5,00,00,000",
                        "tiers": [
                            {"label": "1. CIRP & Liquidation Costs", "amount": "₹50,00,000", "settled": True},
                            {"label": "2. Secured Creditors Dues", "amount": "₹2,50,00,000", "settled": True},
                            {"label": "3. Unpaid Employee Wages", "amount": "₹1,00,00,000", "settled": True},
                            {"label": "4. Financial Debts Unsecured", "amount": "₹1,00,00,000", "settled": True},
                            {"label": "5. Government Dues Exhausted", "amount": "₹0", "settled": False}
                        ],
                        "status": "ORDER OF PRIORITY SATISFIED"
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
        """Requirement 1 & 5: Renders frame A, then B, then A again across ALL 16 built engines, asserting A is pixel-identical both times."""
        import time
        total_slides = len(SAMPLE_PRESENTATION["scenes"])
        self.assertEqual(total_slides, 16, "Must test all 16 built engines for scrub-order independence")
        print("\n" + "="*75)
        print("PER-ENGINE REPRODUCIBILITY & TIMING REPORT:")
        print("="*75)
        for slide_idx in range(total_slides):
            action_type = SAMPLE_PRESENTATION['scenes'][slide_idx]['lines'][0]['action_type']
            t0 = time.perf_counter()

            # Frame A: slide at 1200ms
            img_A1 = self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 1200);
                return document.getElementById('stage_canvas').toDataURL('image/png');
            }}""")

            # Frame B: slide at 3600ms
            self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 3600);
            }}""")

            # Frame A again: slide at 1200ms
            img_A2 = self.page.evaluate(f"""() => {{
                window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 1200);
                return document.getElementById('stage_canvas').toDataURL('image/png');
            }}""")

            dt_ms = (time.perf_counter() - t0) * 1000
            print(f"  * Engine {slide_idx+1:02d} ({action_type:<19}): 3 frames evaluated in {dt_ms:.2f}ms (Scrub A->B->A)")

            self.assertEqual(img_A1, img_A2, f"Slide {slide_idx} ({action_type}): Scrubbing backwards to Frame A must yield 100% pixel-identical buffer")

    def test_settle_hold_65_and_100_pixel_identical(self):
        """Requirement 2 & 5: The 65% and 100% frames are pixel-identical inside mainStageRegion across ALL 16 built engines."""
        import time
        total_slides = len(SAMPLE_PRESENTATION["scenes"])
        self.assertEqual(total_slides, 16, "Must test all 16 built engines for settle hold identity")
        for slide_idx in range(total_slides):
            action_type = SAMPLE_PRESENTATION['scenes'][slide_idx]['lines'][0]['action_type']
            t0 = time.perf_counter()

            img_stage_65, img_stage_100 = self.page.evaluate(f"""() => {{
                const player = window.PRESENTATION_PLAYER;
                const slide = player.data.scenes[{slide_idx}];
                const dur = player.getSlideDurationMs(slide);
                const t65 = dur * 0.65;
                const t100 = dur;

                // Render at 65%
                player.renderFrame({slide_idx}, t65);
                const canvas = document.getElementById('stage_canvas');
                const sub65 = document.createElement('canvas');
                sub65.width = 1184; sub65.height = 480;
                const sctx65 = sub65.getContext('2d');
                const sx = canvas.width / 1280;
                const sy = canvas.height / 720;
                sctx65.drawImage(canvas, 48 * sx, 96 * sy, 1184 * sx, 480 * sy, 0, 0, 1184, 480);
                const data65 = sub65.toDataURL('image/png');

                // Render at 100%
                player.renderFrame({slide_idx}, t100);
                const sub100 = document.createElement('canvas');
                sub100.width = 1184; sub100.height = 480;
                const sctx100 = sub100.getContext('2d');
                sctx100.drawImage(canvas, 48 * sx, 96 * sy, 1184 * sx, 480 * sy, 0, 0, 1184, 480);
                const data100 = sub100.toDataURL('image/png');

                return [data65, data100];
            }}""")

            dt_ms = (time.perf_counter() - t0) * 1000
            print(f"  * Engine {slide_idx+1:02d} ({action_type:<19}): 2 frames evaluated in {dt_ms:.2f}ms (Settle 65%==100%)")

            self.assertEqual(
                img_stage_65,
                img_stage_100,
                f"Slide {slide_idx} ({action_type}): mainStageRegion at 65% and 100% must be 100% pixel-identical"
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
