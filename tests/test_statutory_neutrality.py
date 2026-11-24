import os
import re
import sys
import unittest
from playwright.sync_api import sync_playwright

TOKEN_PRESENTATION = {
    "act_name": "TK_ACT_NAME",
    "section_code": "TK_SECTION_CODE",
    "core_doctrine": "TK_CORE_DOCTRINE",
    "story_summary": "TK_STORY_SUMMARY",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. TK_TAB_1",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_1",
                    "action_type": "money_transfer",
                    "action_payload": {
                        "from_actor": "TK_MTR_PAYER",
                        "to_actor": "TK_MTR_RECEIVER",
                        "amount": "₹50,00,000",
                        "description": "TK_MTR_DESC",
                        "from_action": "TK_MTR_ACTION",
                        "settled_status": "TK_MTR_STATUS"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. TK_TAB_2",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_2",
                    "action_type": "contract_sign",
                    "action_payload": {
                        "title": "TK_CS_TITLE",
                        "parties": "TK_CS_PARTIES",
                        "key_term": "TK_CS_KEY_TERM",
                        "stamp_text": "TK_CS_STAMP",
                        "document_header": "TK_CS_HEADER"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. TK_TAB_3",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_3",
                    "action_type": "handshake_consent",
                    "action_payload": {
                        "party_a": "TK_HC_PARTY_A",
                        "party_b": "TK_HC_PARTY_B",
                        "consent_rule": "TK_HC_RULE",
                        "status": "TK_HC_STATUS",
                        "party_a_role": "TK_HC_ROLE_A",
                        "party_b_role": "TK_HC_ROLE_B",
                        "party_a_badge": "TK_HC_BADGE_A",
                        "party_b_badge": "TK_HC_BADGE_B"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. TK_TAB_4",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_4",
                    "action_type": "goods_transport",
                    "action_payload": {
                        "origin": "TK_GT_ORIGIN",
                        "destination": "TK_GT_DEST",
                        "cargo": "TK_GT_CARGO",
                        "delivery_status": "TK_GT_STATUS"
                    }
                }
            ]
        },
        {
            "id": 5,
            "tab_title": "5. TK_TAB_5",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_5",
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "TK_BB_EVENT",
                        "cause": "TK_BB_CAUSE",
                        "consequence": "TK_BB_CONSEQUENCE"
                    }
                }
            ]
        },
        {
            "id": 6,
            "tab_title": "6. TK_TAB_6",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_6",
                    "action_type": "balance_scale",
                    "action_payload": {
                        "left_weight": "TK_BS_LEFT_W",
                        "left_amount": "₹1,50,000",
                        "right_weight": "TK_BS_RIGHT_W",
                        "right_amount": "₹10,00,000",
                        "verdict": "TK_BS_VERDICT"
                    }
                }
            ]
        },
        {
            "id": 7,
            "tab_title": "7. TK_TAB_7",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_7",
                    "action_type": "gavel_verdict",
                    "action_payload": {
                        "court_name": "TK_GV_COURT",
                        "case_citation": "TK_GV_CITATION",
                        "ratio": "TK_GV_RATIO",
                        "badge": "TK_GV_BADGE"
                    }
                }
            ]
        },
        {
            "id": 8,
            "tab_title": "8. TK_TAB_8",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_8",
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "TK_FM_TITLE",
                        "numeric_value": 75000000,
                        "max_value": 150000000,
                        "min_value": 0,
                        "threshold": 50000000,
                        "direction": "threshold",
                        "unit": "₹",
                        "subtitle": "TK_FM_SUBTITLE",
                        "status": "TK_FM_STATUS"
                    }
                }
            ]
        },
        {
            "id": 9,
            "tab_title": "9. TK_TAB_9",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_9",
                    "action_type": "clock_limitation",
                    "action_payload": {
                        "act_title": "TK_CL_TITLE",
                        "deadline": "TK_CL_DEADLINE",
                        "elapsed": 2,
                        "limit": 3,
                        "unit": "TK_CL_UNIT",
                        "is_barred": False,
                        "detail": "TK_CL_DETAIL",
                        "verdict": "TK_CL_VERDICT"
                    }
                }
            ]
        },
        {
            "id": 10,
            "tab_title": "10. TK_TAB_10",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_10",
                    "action_type": "property_transfer",
                    "action_payload": {
                        "transferor": "TK_PT_TRANSFEROR",
                        "transferee": "TK_PT_TRANSFEREE",
                        "transferor_role": "TK_PT_ROLE_1",
                        "transferee_role": "TK_PT_ROLE_2",
                        "property_desc": "TK_PT_PROP",
                        "deed_title": "TK_PT_DEED",
                        "status": "TK_PT_STATUS"
                    }
                }
            ]
        },
        {
            "id": 11,
            "tab_title": "11. TK_TAB_11",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_11",
                    "action_type": "condition_checklist",
                    "action_payload": {
                        "title": "TK_CC_TITLE",
                        "conditions": [
                            {"text": "TK_CC_COND_1", "satisfied": True},
                            {"text": "TK_CC_COND_2", "satisfied": True},
                            {"text": "TK_CC_COND_3", "satisfied": True}
                        ],
                        "verdict": "TK_CC_VERDICT"
                    }
                }
            ]
        },
        {
            "id": 12,
            "tab_title": "12. TK_TAB_12",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_12",
                    "action_type": "lock_security",
                    "action_payload": {
                        "title": "TK_LS_TITLE",
                        "amount": "₹25,00,000",
                        "obligor": "TK_LS_OBLIGOR",
                        "beneficiary": "TK_LS_BENEFICIARY",
                        "protection_scope": "TK_LS_SCOPE",
                        "status": "TK_LS_STATUS"
                    }
                }
            ]
        },
        {
            "id": 13,
            "tab_title": "13. TK_TAB_13",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_13",
                    "action_type": "corporate_board",
                    "action_payload": {
                        "company_name": "TK_CB_COMPANY",
                        "resolution_title": "TK_CB_RESOLUTION",
                        "votes_for": 85,
                        "votes_against": 15,
                        "required_threshold": 75,
                        "status": "TK_CB_STATUS"
                    }
                }
            ]
        },
        {
            "id": 14,
            "tab_title": "14. TK_TAB_14",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_14",
                    "action_type": "notice_dispatch",
                    "action_payload": {
                        "notice_title": "TK_ND_TITLE",
                        "sender": "TK_ND_SENDER",
                        "recipient": "TK_ND_RECIPIENT",
                        "dispatch_mode": "TK_ND_MODE",
                        "status": "TK_ND_STATUS"
                    }
                }
            ]
        },
        {
            "id": 15,
            "tab_title": "15. TK_TAB_15",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_15",
                    "action_type": "penalty_fine",
                    "action_payload": {
                        "penalty_title": "TK_PF_TITLE",
                        "reason": "TK_PF_REASON",
                        "base_demand": "₹50,00,000",
                        "penalty_amount": "₹50,00,000",
                        "interest_amount": "₹9,00,000",
                        "total_amount": "₹1,09,00,000",
                        "row1_label": "TK_PF_ROW1",
                        "row2_label": "TK_PF_ROW2",
                        "row3_label": "TK_PF_ROW3",
                        "total_label": "TK_PF_TOTAL",
                        "status": "TK_PF_STATUS"
                    }
                }
            ]
        },
        {
            "id": 16,
            "tab_title": "16. TK_TAB_16",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "TK_SENTENCE_16",
                    "action_type": "waterfall_flow",
                    "action_payload": {
                        "waterfall_title": "TK_WF_TITLE",
                        "realized_corpus": "₹5,00,00,000",
                        "tiers": [
                            {"label": "TK_WF_TIER_1", "amount": "₹50,00,000", "settled": True},
                            {"label": "TK_WF_TIER_2", "amount": "₹2,50,00,000", "settled": True},
                            {"label": "TK_WF_TIER_3", "amount": "₹1,00,00,000", "settled": True},
                            {"label": "TK_WF_TIER_4", "amount": "₹1,00,00,000", "settled": True},
                            {"label": "TK_WF_TIER_5", "amount": "₹0", "settled": False}
                        ],
                        "status": "TK_WF_STATUS"
                    }
                }
            ]
        }
    ]
}

# Requirement 3: Frozen allowed-vocabulary list (short, strictly generic layout & UI words)
FROZEN_ALLOWED_VOCABULARY = {
    # Generic UI, Layout, Roles & Scaffolding
    "origin", "destination", "cargo", "authorized", "signatory", "parties",
    "obligor", "beneficiary", "dispatching", "station", "acknowledgment",
    "received", "quorum", "verified", "attending", "assent", "statutory",
    "threshold", "corpus", "step", "scene", "of", "act", "section",
    "amount", "not", "specified", "guaranteed", "quantum", "cause", "consequence", "legal", "ratio"
}

class TestStatutoryNeutrality(unittest.TestCase):
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
        }""", TOKEN_PRESENTATION)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_universal_token_neutrality_all_engines(self):
        """
        Requirement 3 & 5: Universal Token Neutrality Test across ALL 16 built engines.
        Every rendered string on canvas must be an injected token, formatted number,
        Malayalam script, or a word in the frozen allowed generic vocabulary.
        Prints every non-token string seen during the test.
        """
        total_slides = len(TOKEN_PRESENTATION["scenes"])
        self.assertEqual(total_slides, 16, "Must test all 16 built engines for universal token neutrality")

        all_seen_non_tokens = []

        for slide_idx in range(total_slides):
            engine_name = TOKEN_PRESENTATION["scenes"][slide_idx]["lines"][0]["action_type"]
            rendered_texts = self.page.evaluate(f"""() => {{
                const texts = [];
                const origFillText = CanvasRenderingContext2D.prototype.fillText;
                CanvasRenderingContext2D.prototype.fillText = function(text, x, y) {{
                    if (text !== undefined && text !== null) {{
                        texts.push(String(text));
                    }}
                    return origFillText.apply(this, arguments);
                }};

                try {{
                    window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 5400);
                }} finally {{
                    CanvasRenderingContext2D.prototype.fillText = origFillText;
                }}
                return texts;
            }}""")

            for raw_text in rendered_texts:
                txt = raw_text.strip()
                # Check if it contains an injected token
                if "TK_" in txt:
                    # Strip out token portion to inspect any hardcoded prefixes/suffixes
                    stripped = re.sub(r'TK_[A-Z0-9_]+', '', txt).strip()
                else:
                    stripped = txt

                if not stripped:
                    continue

                # Strip out punctuation, numbers, currency symbols, and delimiters
                cleaned = re.sub(r'[₹$€£%0-9.,:;—–\-\(\)/\\•…_ ]+', ' ', stripped).strip()
                if not cleaned:
                    continue

                # Check words
                words = [w.lower() for w in cleaned.split() if w]
                for w in words:
                    # Ignore pure Malayalam unicode characters (0x0D00 to 0x0D7F)
                    if any('\u0d00' <= char <= '\u0d7f' for char in w):
                        continue
                    all_seen_non_tokens.append((engine_name, raw_text, w))
                    self.assertIn(
                        w,
                        FROZEN_ALLOWED_VOCABULARY,
                        f"Engine '{engine_name}' rendered unwhitelisted non-token word '{w}' from text '{raw_text}'"
                    )

        # Print report of non-token strings seen during the test (Requirement 3)
        print("\n" + "="*70)
        print("UNIVERSAL TOKEN NEUTRALITY REPORT - ALL NON-TOKEN STRINGS SEEN:")
        print("="*70)
        seen_set = set()
        for eng, full_txt, word in all_seen_non_tokens:
            entry = f"[{eng}] '{full_txt}' -> word: '{word}'"
            if entry not in seen_set:
                seen_set.add(entry)
                safe_entry = entry.encode('ascii', errors='replace').decode('ascii')
                print(f"  * {safe_entry}")
        print("="*70 + "\n")

    def test_indian_number_grouping_en_in(self):
        """Requirement 4: Universal Indian number grouping (en-IN) up to 99,99,99,999 without US grouping."""
        res = self.page.evaluate("""() => {
            const n1 = window.SHARED_DRAW.formatIndianNumber(999999999);
            const c1 = window.SHARED_DRAW.formatIndianCurrency(999999999);
            const n2 = window.SHARED_DRAW.formatIndianNumber(180000);
            const c2 = window.SHARED_DRAW.formatIndianCurrency("180000");
            const c3 = window.SHARED_DRAW.formatIndianCurrency(50000);
            return { n1, c1, n2, c2, c3 };
        }""")
        self.assertEqual(res["n1"], "99,99,99,999")
        self.assertEqual(res["c1"], "₹99,99,99,999")
        self.assertEqual(res["n2"], "1,80,000")
        self.assertEqual(res["c2"], "₹1,80,000")
        self.assertEqual(res["c3"], "₹50,000")
        self.assertNotIn("999,999,999", res["n1"])

if __name__ == '__main__':
    unittest.main()
