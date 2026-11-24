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
        },
        {
            "id": 8,
            "tab_title": "8. Turnover Threshold",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "Aggregate Turnover for Registration",
                        "numeric_value": 45000000,
                        "max_value": 100000000,
                        "min_value": 0,
                        "threshold": 40000000,
                        "direction": "threshold",
                        "status": "Registration Threshold Exceeded"
                    }
                }
            ]
        },
        {
            "id": 9,
            "tab_title": "9. Statutory Limitation",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "clock_limitation",
                    "action_payload": {
                        "act_title": "Period of Limitation for Show Cause Notice",
                        "deadline": "Within 3 Years from Due Date of Annual Return",
                        "elapsed": 2,
                        "limit": 3,
                        "unit": "Years",
                        "is_barred": False,
                        "verdict": "Within Statutory Limitation Period"
                    }
                }
            ]
        },
        {
            "id": 10,
            "tab_title": "10. Asset Conveyance",
            "layout_archetype": "layout_bilateral_split",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "property_transfer",
                    "action_payload": {
                        "transferor": "Transferor Corporate Entity",
                        "transferee": "Transferee Operating Subsidiary",
                        "property_desc": "Industrial Plant & Machinery",
                        "deed_title": "Statutory Conveyance Deed",
                        "status": "LEGAL TITLE CONVEYED"
                    }
                }
            ]
        },
        {
            "id": 11,
            "tab_title": "11. Essential Preconditions",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "condition_checklist",
                    "action_payload": {
                        "title": "Section 16(2) Mandatory Criteria",
                        "conditions": [
                            {"text": "Tax Invoice in Possession", "satisfied": True},
                            {"text": "Physical Receipt of Consignment", "satisfied": True},
                            {"text": "Tax Discharged to Exchequer", "satisfied": True},
                            {"text": "Return Furnished under Section 39", "satisfied": True}
                        ],
                        "verdict": "ALL 4 CONDITIONS FULLY SATISFIED"
                    }
                }
            ]
        },
        {
            "id": 12,
            "tab_title": "12. Statutory Security",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "lock_security",
                    "action_payload": {
                        "security_type": "Statutory Bank Guarantee under Customs & GST",
                        "amount": "₹25,00,000",
                        "obligor": "Registered Importer Entity",
                        "beneficiary": "Commissioner of Customs",
                        "status": "STATUTORILY SECURED & ENFORCEABLE"
                    }
                }
            ]
        },
        {
            "id": 13,
            "tab_title": "13. Corporate Governance",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "corporate_board",
                    "action_payload": {
                        "company_name": "Apex Manufacturing Corporation Ltd",
                        "resolution_title": "Approval of Statutory Audit Report under Section 134",
                        "votes_for": 90,
                        "votes_against": 10,
                        "required_threshold": 75,
                        "status": "SPECIAL RESOLUTION DULY PASSED"
                    }
                }
            ]
        },
        {
            "id": 14,
            "tab_title": "14. Statutory Service",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "notice_dispatch",
                    "action_payload": {
                        "notice_title": "Statutory Demand Notice under Section 73",
                        "sender": "Office of Assistant Commissioner",
                        "recipient": "Taxable Registered Supplier",
                        "dispatch_mode": "Speed Post with Electronic AD",
                        "status": "NOTICE DULY SERVED & ACKNOWLEDGED"
                    }
                }
            ]
        },
        {
            "id": 15,
            "tab_title": "15. Penalty Assessment",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "penalty_fine",
                    "action_payload": {
                        "penalty_title": "Statutory Revenue Penalty under Section 122",
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
            "tab_title": "16. Statutory Waterfall",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "action_type": "waterfall_flow",
                    "action_payload": {
                        "waterfall_title": "Section 53 IBC Statutory Waterfall",
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

FORBIDDEN_CONTRACT_TERMS = [
    "section 73 damages",
    "section 10",
    "breach of contract",
    "ordinary loss",
    "remote loss",
    "natural damages",
    "remitting consideration",
    "consensus ad idem",
    "vested & mutated",
    "relinquishing possession"
]

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
        }""", NON_CONTRACT_PRESENTATION)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def test_non_contract_payload_renders_without_contract_strings(self):
        """Requirement 4: Non-contract payloads (GST / Companies Act) across all 16 built engines must not display hardcoded contract-law strings."""
        total_slides = len(NON_CONTRACT_PRESENTATION["scenes"])
        self.assertEqual(total_slides, 16, "Must test all 16 built engines for statutory neutrality")
        for slide_idx in range(total_slides):
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
