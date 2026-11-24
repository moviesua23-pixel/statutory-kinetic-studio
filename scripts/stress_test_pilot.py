import os
import sys
import base64
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import io

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if STUDIO_DIR not in sys.path:
    sys.path.insert(0, STUDIO_DIR)

ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"

STRESS_PRESENTATION = {
    "act_name": "Central Goods and Services Tax Act, 2017 & Indian Contract Act, 1872",
    "section_code": "Section 73 & Section 74 (High Quantum Dispute)",
    "core_doctrine": "Statutory Adjudication of Substantial Consideration & Damages",
    "story_summary": "Corporate dispute involving extreme consideration amounts and complex Malayalam statutory scaffolding.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. High-Value Money Transfer",
            "layout_archetype": "layout_bilateral_split",
            "layout_payload": {
                "left_label": "The Cochin Commercial Trading & Warehousing Corporation Private Limited",
                "left_role": "Primary Consignor & Corporate Contractor",
                "right_label": "The Additional Commissioner of State Goods and Services Tax Appellate Authority, Ernakulam",
                "right_role": "Statutory Revenue Authority"
            },
            "dialogue": "കരാർ പ്രകാരം ബാധ്യതപ്പെട്ട വൻതുകയായ തൊണ്ണൂറ്റിയൊമ്പത് കോടി രൂപ ട്രഷറി അക്കൗണ്ടിലേക്ക് കൈമാറ്റം ചെയ്തതായി കമ്പനി പ്രതിനിധി ബോധിപ്പിച്ചു.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കരാർ പ്രകാരം ബാധ്യതപ്പെട്ട വൻതുകയായ തൊണ്ണൂറ്റിയൊമ്പത് കോടി രൂപ ട്രഷറി അക്കൗണ്ടിലേക്ക് കൈമാറ്റം ചെയ്തതായി കമ്പനി പ്രതിനിധി ബോധിപ്പിച്ചു.",
                    "line_title": "Statutory Consideration Handover",
                    "duration_ms": 4500,
                    "action_type": "money_transfer",
                    "action_payload": {
                        "from_actor": "Cochin Commercial Trading Corp Ltd",
                        "to_actor": "Addl Commissioner GST Authority",
                        "amount": "₹99,99,99,999",
                        "description": "Statutory Remittance under Protest"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Balance Scale (Extreme Quantum)",
            "layout_archetype": "layout_hero_stage",
            "layout_payload": {
                "hero_headline": "Direct Natural Loss vs Speculative Remote Demands (₹99 Crores)",
                "focal_element": "Judicial Balancing of Heavy Corporate Liabilities"
            },
            "dialogue": "നേരിട്ടുണ്ടായ യഥാർത്ഥ നഷ്ടവും മുൻകൂട്ടി അറിയിക്കാത്ത ഊഹാപോഹപരമായ ഭീമമായ നഷ്ടപരിഹാരവും തമ്മിൽ കോടതി തുലാസിൽ തൂക്കി വിലയിരുത്തുന്നു.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നേരിട്ടുണ്ടായ യഥാർത്ഥ നഷ്ടവും മുൻകൂട്ടി അറിയിക്കാത്ത ഊഹാപോഹപരമായ ഭീമമായ നഷ്ടപരിഹാരവും തമ്മിൽ കോടതി തുലാസിൽ തൂക്കി വിലയിരുത്തുന്നു.",
                    "line_title": "Weighing High Quantum Claims",
                    "duration_ms": 4500,
                    "action_type": "balance_scale",
                    "action_payload": {
                        "left_weight": "Direct Commercial Loss",
                        "left_amount": "₹12,50,00,000",
                        "right_weight": "Remote Speculative Demand",
                        "right_amount": "₹99,99,99,999",
                        "verdict": "Scale Tilts: Special Remote Loss Barred Without Specific Express Notice"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Gavel Verdict (Landmark Ratio)",
            "layout_archetype": "layout_precedent_parchment",
            "layout_payload": {
                "court": "SUPREME COURT OF INDIA (CONSTITUTION BENCH)",
                "case_name": "State of Kerala & Ors. v. Cochin Commercial Trading Corporation Ltd. (2024)",
                "year": "2024",
                "ratio_headline": "Statutory Penalties Cannot Exceed Direct Established Default Under Section 73"
            },
            "dialogue": "സർക്കാർ വകുപ്പുകൾക്ക് മുൻകൂട്ടി നോട്ടീസ് നൽകാതെ ഭീമമായ പിഴ ചുമത്താൻ അധികാരമില്ലെന്ന് സുപ്രീം കോടതിയുടെ ഭരണഘടനാ ബെഞ്ച് അന്തിമ വിധി പ്രസ്താവിച്ചു.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "സർക്കാർ വകുപ്പുകൾക്ക് മുൻകൂട്ടി നോട്ടീസ് നൽകാതെ ഭീമമായ പിഴ ചുമത്താൻ അധികാരമില്ലെന്ന് സുപ്രീം കോടതിയുടെ ഭരണഘടനാ ബെഞ്ച് അന്തിമ വിധി പ്രസ്താവിച്ചു.",
                    "line_title": "Supreme Court Binding Ratio",
                    "duration_ms": 4500,
                    "action_type": "gavel_verdict",
                    "action_payload": {
                        "court_name": "SUPREME COURT OF INDIA",
                        "case_citation": "Civil Appeal No. 9842 of 2024",
                        "ratio": "Statutory authorities cannot levy consequential penal damages without strict proof of proximate causation."
                    }
                }
            ]
        }
    ]
}

def run_stress_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        # Reveal & load stress test presentation
        page.evaluate("""(data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;
        }""", STRESS_PRESENTATION)

        captured = {}

        for slide_idx, engine_name in [(0, "money_transfer"), (1, "balance_scale"), (2, "gavel_verdict")]:
            for theme in ["light", "dark"]:
                data_url = page.evaluate(f"""() => {{
                    window.THEME.setMode('{theme}');
                    window.PRESENTATION_PLAYER.renderFrame({slide_idx}, 4000); // Settle hold state
                    return document.getElementById('stage_canvas').toDataURL('image/png');
                }}""")

                header, encoded = data_url.split(",", 1)
                img = Image.open(io.BytesIO(base64.b64decode(encoded)))
                filename = f"stress_{engine_name}_{theme}.png"
                img.save(os.path.join(ARTIFACT_DIR, filename))
                captured[(engine_name, theme)] = img
                print(f"Captured: {filename}")

        browser.close()

        # Build Stress Test Composite Image: 3 columns (1 per engine) x 2 rows (Light & Dark)
        thumb_w = 600
        thumb_h = int(thumb_w * 720 / 1280)
        comp_w = thumb_w * 3 + 40
        comp_h = thumb_h * 2 + 100

        composite = Image.new("RGB", (comp_w, comp_h), "#0B0F19")
        draw = ImageDraw.Draw(composite)

        for col_idx, (engine_name, label) in enumerate([
            ("money_transfer", "Money Transfer (₹99,99,99,999 + Long Corp Names)"),
            ("balance_scale", "Balance Scale (₹99 Crores vs ₹12.5 Crores + Malayalam)"),
            ("gavel_verdict", "Gavel Verdict (Constitution Bench + Complex Ratio)")
        ]):
            for row_idx, theme in enumerate(["light", "dark"]):
                src_img = captured[(engine_name, theme)]
                resized = src_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                x = 10 + col_idx * (thumb_w + 10)
                y = 40 + row_idx * (thumb_h + 30)
                composite.paste(resized, (x, y))

                tag = f"{label} - {theme.upper()}"
                draw.text((x + 8, y - 22), tag, fill="#F8FAFC")

        comp_path = os.path.join(ARTIFACT_DIR, "composite_stress_test_pilot.png")
        composite.save(comp_path)
        print(f"Generated Stress Composite: {comp_path}")

if __name__ == '__main__':
    run_stress_test()
