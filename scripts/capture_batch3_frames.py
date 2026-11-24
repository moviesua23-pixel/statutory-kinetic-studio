import os
import sys
import io
import base64
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

BATCH3_PRESENTATION = {
    "act_name": "Insolvency and Bankruptcy Code, 2016 & Companies Act, 2013",
    "section_code": "Section 53 IBC, Section 188 & Section 74 CGST",
    "core_doctrine": "Fiduciary Security, Board Governance, Notice Service, Penalty & Priority Waterfall",
    "story_summary": "Comprehensive visual validation of Batch 3 engines: lock_security, corporate_board, notice_dispatch, penalty_fine, waterfall_flow.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Lock Security (Bank Guarantee)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കരാർ ലംഘനം ഉണ്ടായാൽ ഈടാക്കുവാനായി ബാങ്ക് ഗ്യാരണ്ടി സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു.",
                    "line_title": "Irrevocable Bank Guarantee Deposit",
                    "duration_ms": 5400,
                    "action_type": "lock_security",
                    "action_payload": {
                        "security_type": "Irrevocable Bank Guarantee (Performance Bond)",
                        "amount": "₹25,00,000",
                        "obligor": "National Infrastructure Developers Ltd",
                        "beneficiary": "Kerala State Electricity Board (KSEB)",
                        "status": "STATUTORILY SECURED & ENFORCEABLE"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Corporate Board (Resolution)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കമ്പനി ബോർഡ് യോഗം ചേർന്ന് എഴുപത്തഞ്ച് ശതമാനം ഭൂരിപക്ഷത്തോടെ പ്രത്യേക പ്രമേയം പാസാക്കി.",
                    "line_title": "Board of Directors Special Resolution",
                    "duration_ms": 5400,
                    "action_type": "corporate_board",
                    "action_payload": {
                        "company_name": "Apex Petrochemicals Corporation Ltd",
                        "resolution_title": "Approval of Material Related Party Contract (Sec 188)",
                        "votes_for": 85,
                        "votes_against": 15,
                        "required_threshold": 75,
                        "status": "SPECIAL RESOLUTION DULY PASSED (85% ASSENT)"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Notice Dispatch (Statutory Service)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നിയമപരമായ കാരണം കാണിക്കൽ നോട്ടീസ് കൃത്യമായ വിലാസത്തിൽ രജിസ്റ്റേർഡ് തപാലിൽ അയച്ചു നൽകി.",
                    "line_title": "Statutory Demand Notice Dispatch",
                    "duration_ms": 5400,
                    "action_type": "notice_dispatch",
                    "action_payload": {
                        "notice_title": "Statutory Show Cause Notice under Section 73",
                        "sender": "Office of Assistant Commissioner of Central Tax",
                        "recipient": "M/s Horizon Industrial Enterprises Pvt Ltd",
                        "dispatch_mode": "Registered Post with Acknowledgment Due (RPAD)",
                        "status": "NOTICE DULY SERVED & ACKNOWLEDGED"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Penalty Fine (Revenue Demand)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നികുതി വെട്ടിപ്പ് കണ്ടെത്തിയതിനെ തുടർന്ന് പിഴയും പലിശയും അടക്കമുള്ള ഡിമാൻഡ് ഉത്തരവ് പുറപ്പെടുവിച്ചു.",
                    "line_title": "Statutory Revenue Penalty Order",
                    "duration_ms": 5400,
                    "action_type": "penalty_fine",
                    "action_payload": {
                        "penalty_title": "Statutory Revenue Penalty & Demand (Sec 74)",
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
            "id": 5,
            "tab_title": "5. Waterfall Flow (IBC Priority)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "ലിക്വിഡേഷൻ ആസ്തികൾ മുൻഗണനാ ക്രമമനുസരിച്ച് ഘട്ടം ഘട്ടമായി വിതരണം ചെയ്യുന്നു.",
                    "line_title": "Section 53 Statutory Priority Waterfall",
                    "duration_ms": 5400,
                    "action_type": "waterfall_flow",
                    "action_payload": {
                        "waterfall_title": "IBC Section 53 Statutory Liquidation Waterfall",
                        "realized_corpus": "₹5,00,00,000",
                        "tiers": [
                            {"label": "1. Insolvency Resolution & Liquidation Costs", "amount": "₹50,00,000", "settled": True},
                            {"label": "2. Secured Creditors & Workmen Dues (24m)", "amount": "₹2,50,00,000", "settled": True},
                            {"label": "3. Unpaid Employee Wages (12m)", "amount": "₹1,00,00,000", "settled": True},
                            {"label": "4. Financial Debts of Unsecured Creditors", "amount": "₹1,00,00,000", "settled": True},
                            {"label": "5. Government Dues & Remaining Debts", "amount": "₹0 (Exhausted)", "settled": False}
                        ],
                        "status": "CASCADE SETTLED: ORDER OF PRIORITY SATISFIED"
                    }
                }
            ]
        }
    ]
}

PERCENTAGES = [
    ("0pct", 0),
    ("30pct", 1620),
    ("65pct", 3510),
    ("100pct", 5400)
]

ENGINES = [
    (0, "lock_security"),
    (1, "corporate_board"),
    (2, "notice_dispatch"),
    (3, "penalty_fine"),
    (4, "waterfall_flow")
]

def capture_batch3():
    print("Launching Playwright for Batch 3 Engines capture...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        page.evaluate("""async (data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;
        }""", BATCH3_PRESENTATION)

        captured = {}

        for slide_idx, engine_name in ENGINES:
            for theme in ["light", "dark"]:
                for pct_label, time_ms in PERCENTAGES:
                    data_url = page.evaluate(f"""() => {{
                        window.THEME.setMode('{theme}');
                        window.PRESENTATION_PLAYER.renderFrame({slide_idx}, {time_ms});
                        return document.getElementById('stage_canvas').toDataURL('image/png');
                    }}""")

                    header, encoded = data_url.split(",", 1)
                    img = Image.open(io.BytesIO(base64.b64decode(encoded)))
                    filename = f"batch3_{engine_name}_{pct_label}_{theme}.png"
                    img.save(os.path.join(ARTIFACT_DIR, filename))
                    captured[(engine_name, theme, pct_label)] = img
                    print(f"Captured: {filename}")

            # Generate composite overview for this engine (4 progress points x 2 themes)
            thumb_w = 480
            thumb_h = 270
            comp_w = thumb_w * 4 + 50
            comp_h = thumb_h * 2 + 70
            comp = Image.new("RGB", (comp_w, comp_h), "#0F172A")
            draw = ImageDraw.Draw(comp)

            # Titles
            draw.text((20, 10), f"ENGINE: {engine_name.upper()} - 0%, 30%, 65%, 100% TIMING STATES (LIGHT & DARK)", fill="#F8FAFC")

            for r_idx, theme in enumerate(["light", "dark"]):
                for c_idx, (pct_label, _) in enumerate(PERCENTAGES):
                    key = (engine_name, theme, pct_label)
                    if key in captured:
                        thumb = captured[key].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                        x = 20 + c_idx * (thumb_w + 10)
                        y = 40 + r_idx * (thumb_h + 10)
                        comp.paste(thumb, (x, y))

            comp_path = os.path.join(ARTIFACT_DIR, f"composite_batch3_{engine_name}.png")
            comp.save(comp_path)
            print(f"Saved Engine Composite: {comp_path}")

        browser.close()
    print("All Batch 3 engine frames captured successfully!")

if __name__ == "__main__":
    capture_batch3()
