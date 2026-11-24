import os
import sys
import io
import base64
from playwright.sync_api import sync_playwright
from PIL import Image

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

STRESS_BATCH2_PRESENTATION = {
    "act_name": "Central Goods and Services Tax Act, 2017 & Transfer of Property Act, 1882",
    "section_code": "Section 16(2), Section 73 & Section 54",
    "core_doctrine": "Statutory Eligibility, Limitation Defense, Quantum & Asset Conveyance",
    "story_summary": "Comprehensive stress testing of Batch 2 engines with 2 vs 6 checklist items, extreme Indian currency grouping (₹99,99,99,999), missing quantum data, and extensive Malayalam narrations.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Checklist (2 Criteria)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "ടാക്സ് ഇൻവോയ്സും നികുതി അടച്ച രേഖകളും കൃത്യമാണോ എന്ന് പരിശോധിച്ച ശേഷം മാത്രം ഇൻപുട്ട് ടാക്സ് ക്രെഡിറ്റ് അനുവദിക്കുകയുള്ളൂ. രണ്ടു വ്യവസ്ഥകളും നിർബന്ധമാണ്.",
                    "line_title": "Bilateral Criterion Verification",
                    "duration_ms": 6500,
                    "action_type": "condition_checklist",
                    "action_payload": {
                        "title": "Essential Statutory Preconditions (2 Criteria)",
                        "conditions": [
                            {"text": "Valid Prescribed Tax Invoice / Inward Supply Document in Possession", "satisfied": True},
                            {"text": "Statutory Output Tax Remitted to the Credit of the Appropriate Government", "satisfied": True}
                        ],
                        "verdict": "ALL 2 STATUTORY CONDITIONS SATISFIED"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Checklist (6 Criteria)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "ആറ് കർശനമായ നിയമപരമായ മാനദണ്ഡങ്ങളും പൂർണ്ണമായി പാലിച്ചാൽ മാത്രമേ രജിസ്റ്റർ ചെയ്ത നികുതിദായകന് ഇൻപുട്ട് ടാക്സ് ക്രെഡിറ്റ് ക്ലെയിം ചെയ്യുവാൻ അർഹതയുണ്ടാകൂ.",
                    "line_title": "Hexagonal Statutory Scrutiny",
                    "duration_ms": 7200,
                    "action_type": "condition_checklist",
                    "action_payload": {
                        "title": "Comprehensive Statutory Preconditions (6 Criteria)",
                        "conditions": [
                            {"text": "1. Prescribed Tax Invoice or Inward Delivery Challan in Legal Possession", "satisfied": True},
                            {"text": "2. Actual Physical Consignment of Goods or Execution of Services Certified", "satisfied": True},
                            {"text": "3. Supplier Output Tax Deposited with Central or State Exchequer", "satisfied": True},
                            {"text": "4. Prescribed Statutory Monthly Return Furnished under Section 39", "satisfied": True},
                            {"text": "5. Auto-Populated Invoice Reconciliation in Form GSTR-2B Verified", "satisfied": True},
                            {"text": "6. Non-Reversal Mandate under Section 17(5) Fully Complied", "satisfied": True}
                        ],
                        "verdict": "ALL 6 STATUTORY CONDITIONS SATISFIED"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Meter (₹99,99,99,999)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "ബിസിനസ്സ് സ്ഥാപനത്തിന്റെ വാർഷിക വിറ്റുവരവ് തൊണ്ണൂറ്റൊൻപത് കോടി തൊണ്ണൂറ്റൊൻപത് ലക്ഷം രൂപ കവിയുമ്പോൾ പ്രത്യേക നിരീക്ഷണവും ഇ-ഇൻവോയ്സിംഗും നിർബന്ധമാണ്.",
                    "line_title": "High-Quantum Turnover Assessment",
                    "duration_ms": 7200,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "Aggregate National Turnover & Statutory Ceiling",
                        "numeric_value": 999999999,
                        "max_value": 1000000000,
                        "min_value": 0,
                        "threshold": 500000000,
                        "direction": "gain",
                        "unit": "₹",
                        "status": "STATUTORY THRESHOLD EXCEEDED"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Meter (Missing Data)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നഷ്ടപരിഹാര തുക ട്രൈബ്യൂണൽ അന്തിമമായി തിട്ടപ്പെടുത്തുന്നത് വരെ കണക്കുകൾ താല്ക്കാലികമായി രേഖപ്പെടുത്താതെ സുതാര്യമായി വെക്കുന്നു.",
                    "line_title": "Unascertained Damages Assessment",
                    "duration_ms": 6800,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "Unascertained Statutory Fine & Damages",
                        "direction": "loss",
                        "unit": "₹",
                        "status": "PENDING TRIBUNAL ADJUDICATION"
                    }
                }
            ]
        },
        {
            "id": 5,
            "tab_title": "5. Clock (Derived & Barred)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നിശ്ചിത സമയപരിധിയായ മൂന്ന് വർഷം പൂർത്തിയായതിനാൽ വകുപ്പ് 73 പ്രകാരമുള്ള നികുതി ഡിമാൻഡ് നോട്ടീസ് അയക്കുവാനുള്ള അധികാരം റദ്ദാക്കപ്പെട്ടു.",
                    "line_title": "Limitation Period Determination",
                    "duration_ms": 6500,
                    "action_type": "clock_limitation",
                    "action_payload": {
                        "act_title": "Statutory Limitation Period under Section 73",
                        "deadline": "Within 3 Years from Due Date of Annual Return",
                        "elapsed": 3,
                        "limit": 3,
                        "unit": "Years",
                        "is_barred": True,
                        "verdict": "TIME-BARRED: STATUTORY DEMAND EXTINGUISHED"
                    }
                }
            ]
        },
        {
            "id": 6,
            "tab_title": "6. Property Transfer (Stress)",
            "layout_archetype": "layout_bilateral_split",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "സ്ഥാവര സ്വത്തിന്റെ ഉടമസ്ഥാവകാശവും കൈവശാവകാശവും രജിസ്റ്റർ ചെയ്ത ആധാരത്തിലൂടെ പുതിയ കക്ഷിയിലേക്ക് പൂർണ്ണമായും കൈമാറ്റം ചെയ്യപ്പെടുന്നു.",
                    "line_title": "High-Value Asset Conveyance",
                    "duration_ms": 6500,
                    "action_type": "property_transfer",
                    "action_payload": {
                        "transferor": "Sri Mampuzha Ksheerolpadaka Sahakarana Sangham Bharana Samithi",
                        "transferor_role": "Transferor Cooperative Society",
                        "transferee": "Thiruvananthapuram Integrated Infrastructure Development Corporation Ltd",
                        "transferee_role": "Transferee Statutory Development Body",
                        "property_desc": "Prime Industrial SEZ Real Estate Complex (Valued at ₹99,99,99,999)",
                        "deed_title": "Registered Indenture of Absolute Conveyance",
                        "status": "TITLE CONVEYED"
                    }
                }
            ]
        }
    ]
}

def main():
    print("Starting Stress Test for Batch 2 Action Engines...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        # Load presentation
        page.evaluate("""async (data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;
        }""", STRESS_BATCH2_PRESENTATION)

        themes = ["light", "dark"]
        captured_images = {}

        for theme in themes:
            print(f"Capturing Batch 2 stress test frames in {theme.upper()} mode...")
            for scene_idx, scene in enumerate(STRESS_BATCH2_PRESENTATION["scenes"]):
                tab_title = scene["tab_title"].split(". ")[1].replace(" ", "_").lower().replace("(", "").replace(")", "").replace("₹", "").replace(",", "")
                data_url = page.evaluate(f"""() => {{
                    window.THEME.setMode('{theme}');
                    const dur = window.PRESENTATION_PLAYER.getSlideDurationMs(window.PRESENTATION_PLAYER.data.scenes[{scene_idx}]);
                    window.PRESENTATION_PLAYER.renderFrame({scene_idx}, dur);
                    return document.getElementById('stage_canvas').toDataURL('image/png');
                }}""")

                header, encoded = data_url.split(",", 1)
                img = Image.open(io.BytesIO(base64.b64decode(encoded)))

                key = f"{tab_title}_{theme}"
                captured_images[key] = img

                filename = f"batch2_stress_{tab_title}_{theme}.png"
                img.save(os.path.join(ARTIFACT_DIR, filename))
                print(f"  Saved {filename}")

        browser.close()

    # Create composite overview image
    # 6 scenes x 2 themes = 12 panels (3 columns x 4 rows or 2 columns x 6 rows)
    # Let's do 2 columns (Light vs Dark) x 6 rows (the 6 scenes)
    print("Generating composite overview image: composite_stress_test_batch2.png...")
    sample_img = next(iter(captured_images.values()))
    orig_w, orig_h = sample_img.size
    scale = 0.5
    thumb_w, thumb_h = int(orig_w * scale), int(orig_h * scale)

    grid_cols = 2
    grid_rows = 6
    pad = 16
    header_h = 40

    comp_w = grid_cols * thumb_w + (grid_cols + 1) * pad
    comp_h = grid_rows * thumb_h + (grid_rows + 1) * pad + header_h

    composite = Image.new("RGB", (comp_w, comp_h), color="#0F172A")

    scene_keys = [
        "checklist_2_criteria",
        "checklist_6_criteria",
        "meter_999999999",
        "meter_missing_data",
        "clock_derived_&_barred",
        "property_transfer_stress"
    ]

    for row_idx, sk in enumerate(scene_keys):
        for col_idx, theme in enumerate(["light", "dark"]):
            key = f"{sk}_{theme}"
            if key in captured_images:
                img = captured_images[key].resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                x = pad + col_idx * (thumb_w + pad)
                y = header_h + pad + row_idx * (thumb_h + pad)
                composite.paste(img, (x, y))

    comp_path = os.path.join(ARTIFACT_DIR, "composite_stress_test_batch2.png")
    composite.save(comp_path)
    print(f"Saved Batch 2 stress test composite: {comp_path}")
    print("Batch 2 Stress Test complete!")

if __name__ == "__main__":
    main()
