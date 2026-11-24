import os
import sys
import io
import base64
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

BATCH2_PRESENTATION = {
    "act_name": "Companies Act, 2013 & Central GST Act, 2017",
    "section_code": "Section 135, Section 3 Limitation Act & Section 16(2)",
    "core_doctrine": "Statutory Thresholds, Limitation Periods, Conveyance & Multi-Condition Tests",
    "story_summary": "Comprehensive test of Batch 2 action engines: financial_meter, clock_limitation, property_transfer, condition_checklist.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Financial Meter (CSR Threshold)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കമ്പനിയുടെ ലാഭം നിർദ്ദിഷ്ട പരിധി കവിഞ്ഞതിനാൽ സാമൂഹിക പ്രതിബദ്ധതാ ഫണ്ട് ബാധകമാകുന്നു.",
                    "line_title": "Net Profit Evaluation under Section 135",
                    "duration_ms": 5400,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "Corporate Net Profit Metric (Section 135(1))",
                        "min_val": 0,
                        "max_val": 150000000,
                        "current_val": 75000000,
                        "threshold": 50000000,
                        "unit": "₹",
                        "status": "CSR APPLICABILITY THRESHOLD TRIGGERED"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Clock Limitation (Statutory Window)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നിയമപരമായ സമയപരിധിക്കുള്ളിൽ തന്നെ അപ്പീൽ അല്ലെങ്കിൽ ഹർജി സമർപ്പിക്കേണ്ടതുണ്ട്.",
                    "line_title": "Limitation Expiry Assessment",
                    "duration_ms": 5400,
                    "action_type": "clock_limitation",
                    "action_payload": {
                        "act_title": "Limitation Act, 1963 (Section 3 & Schedule)",
                        "deadline": "3-Year Prescribed Limitation Period",
                        "detail": "Suit for breach of contract must be instituted within 3 years from cause of action.",
                        "is_barred": False,
                        "verdict": "FILED WITHIN LIMITATION: CLAIM MAINTAINABLE"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Property Transfer (Title Conveyance)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "സ്ഥാവര സ്വത്തിന്റെ ഉടമസ്ഥാവകാശം രജിസ്റ്റർ ചെയ്ത ആധാരത്തിലൂടെ പൂർണ്ണമായി കൈമാറുന്നു.",
                    "line_title": "Title Conveyance & Mutation",
                    "duration_ms": 5400,
                    "action_type": "property_transfer",
                    "action_payload": {
                        "transferor": "Sterling Commercial Developers Ltd",
                        "transferee": "Federal Maritime Logistics Trust",
                        "property_desc": "Prime Industrial Complex (Kochi SEZ)",
                        "deed_title": "Registered Sale Deed No. 402/2024",
                        "status": "ABSOLUTE TITLE VESTED & MUTATED"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Condition Checklist (Statutory Test)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നികുതി ക്രെഡിറ്റ് ലഭിക്കുന്നതിന് ആവശ്യമായ നാല് നിബന്ധനകളും പൂർണ്ണമായി പാലിച്ചിരിക്കുന്നു.",
                    "line_title": "Four Essential Criteria under Section 16(2)",
                    "duration_ms": 5400,
                    "action_type": "condition_checklist",
                    "action_payload": {
                        "title": "Input Tax Credit Eligibility Criteria (Sec 16(2))",
                        "conditions": [
                            {"text": "1. Possession of Valid Tax Invoice or Debit Note", "satisfied": True},
                            {"text": "2. Details Communicated in GSTR-2B Statement", "satisfied": True},
                            {"text": "3. Tax Actually Paid to Government Treasury", "satisfied": True},
                            {"text": "4. Valid Prescribed Return under Section 39 Furnished", "satisfied": True}
                        ],
                        "verdict": "ALL 4 STATUTORY CONDITIONS SATISFIED • ITC GRANTED"
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
    (0, "financial_meter"),
    (1, "clock_limitation"),
    (2, "property_transfer"),
    (3, "condition_checklist")
]

def capture_batch2():
    print("Launching Playwright for Batch 2 Engines capture...")
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
        }""", BATCH2_PRESENTATION)

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
                    filename = f"batch2_{engine_name}_{pct_label}_{theme}.png"
                    img.save(os.path.join(ARTIFACT_DIR, filename))
                    captured[(engine_name, theme, pct_label)] = img
                    print(f"Captured: {filename}")

            # Generate composite overview for this engine (4 progress points x 2 themes)
            thumb_w = 480
            thumb_h = int(thumb_w * 720 / 1280)
            comp_w = thumb_w * 4 + 50
            comp_h = thumb_h * 2 + 100

            comp = Image.new("RGB", (comp_w, comp_h), "#0F172A")
            draw = ImageDraw.Draw(comp)

            for row_idx, theme in enumerate(["light", "dark"]):
                draw.text((20, 20 + row_idx * (thumb_h + 40)), f"{engine_name.upper()} — {theme.upper()} THEME", fill="#94A3B8")
                for col_idx, (pct_label, _) in enumerate(PERCENTAGES):
                    key = (engine_name, theme, pct_label)
                    if key in captured:
                        thumb = captured[key].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                        x = 20 + col_idx * (thumb_w + 10)
                        y = 45 + row_idx * (thumb_h + 40)
                        comp.paste(thumb, (x, y))
                        draw.text((x + 8, y + 8), f"{pct_label} ({'35% Hold' if pct_label in ['65pct', '100pct'] else 'Enter/Perform'})", fill="#F8FAFC")

            comp_path = os.path.join(ARTIFACT_DIR, f"composite_batch2_{engine_name}.png")
            comp.save(comp_path, quality=92)
            print(f"Saved Engine Composite: {comp_path}")

        browser.close()

if __name__ == "__main__":
    capture_batch2()
