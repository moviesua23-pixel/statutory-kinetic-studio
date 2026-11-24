import os
import sys
import unittest
from playwright.sync_api import sync_playwright

NON_CONTRACT_PRESENTATION = {
    "act_name": "Central Goods and Services Tax Act, 2017",
    "section_code": "Section 16(2)",
    "core_doctrine": "Eligibility and Conditions for Taking Input Tax Credit",
    "story_summary": "Statutory assessment of inward tax invoices, physical receipt of goods, and tax remittance.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Tax Remittance",
            "layout_archetype": "layout_bilateral_split",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "money_transfer",
                    "action_payload": {
                        "from_actor": "Taxable Supplier",
                        "to_actor": "Central Government",
                        "amount": "₹1,80,000",
                        "description": "GST Output Tax Payment"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Tax Invoice Filing",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "contract_sign",
                    "action_payload": {
                        "title": "Tax Invoice under Section 31",
                        "parties": "Supplier & Recipient Registered Entities",
                        "key_term": "Prescribed Tax Invoice & E-Way Bill Particulars",
                        "stamp_text": "FILED & VALIDATED"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Statutory Reconciliation",
            "layout_archetype": "layout_bilateral_split",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "handshake_consent",
                    "action_payload": {
                        "party_a": "GSTR-1 Supplier Return",
                        "party_b": "GSTR-2B Auto-Drafted Statement",
                        "consent_rule": "Section 16(2)(aa) Matching Principle",
                        "status": "Invoice Matched & ITC Eligible"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Goods Movement",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "goods_transport",
                    "action_payload": {
                        "origin": "Manufacturing Unit (Pune)",
                        "destination": "Registered Warehouse (Ernakulam)",
                        "cargo": "Industrial Machinery Consignment",
                        "delivery_status": "RECEIVED & DOCUMENTED: Form GSTR-2B"
                    }
                }
            ]
        },
        {
            "id": 5,
            "tab_title": "5. Default Barrier",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "ITC Ineligibility Notice",
                        "cause": "Supplier Non-Payment under Section 16(2)(c)",
                        "consequence": "ITC Reversal with Statutory Interest under Section 50"
                    }
                }
            ]
        },
        {
            "id": 6,
            "tab_title": "6. Balance Scale",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "balance_scale",
                    "action_payload": {
                        "left_weight": "Eligible Input Tax Credit",
                        "left_amount": "₹1,80,000",
                        "right_weight": "Ineligible Blocked Credit (Sec 17(5))",
                        "right_amount": "₹45,000",
                        "verdict": "Net Output Liability Discharged"
                    }
                }
            ]
        },
        {
            "id": 7,
            "tab_title": "7. Appellate Verdict",
            "layout_archetype": "layout_precedent_parchment",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "gavel_verdict",
                    "action_payload": {
                        "court_name": "SUPREME COURT OF INDIA",
                        "case_citation": "Union of India v. Bharti Airtel Ltd (2022)",
                        "ratio": "ITC is a statutory entitlement subject to strict fulfillment of statutory preconditions.",
                        "badge": "STATUTORY MANDATE UPHELD"
                    }
                }
            ]
        }
    ]
}

FORBIDDEN_CONTRACT_TERMS = [
    "section 73",
    "section 10",
    "breach of contract",
    "ordinary loss",
    "remote loss",
    "natural damages",
    "remitting consideration",
    "consensus ad idem (section 10"
]

class TestStatutoryNeutrality(unittest.TestCase):
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
        }""", NON_CONTRACT_PRESENTATION)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_non_contract_payload_renders_without_contract_strings(self):
        """Requirement 4: Non-contract payloads (GST / Companies Act) must not display hardcoded contract-law strings."""
        for slide_idx in range(len(NON_CONTRACT_PRESENTATION["scenes"])):
            rendered_texts = self.page.evaluate(f"""() => {{
                const texts = [];
                const origFillText = CanvasRenderingContext2D.prototype.fillText;
                CanvasRenderingContext2D.prototype.fillText = function(text, x, y) {{
                    if (text !== undefined && text !== null) {{
                        texts.push(String(text).toLowerCase());
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

            all_text_blob = " ".join(rendered_texts)
            for forbidden in FORBIDDEN_CONTRACT_TERMS:
                self.assertNotIn(
                    forbidden,
                    all_text_blob,
                    f"Slide {slide_idx} rendered forbidden contract string '{forbidden}' when using GST payload!"
                )

if __name__ == '__main__':
    unittest.main()
