import os
import sys
import io
import base64
from playwright.sync_api import sync_playwright
from PIL import Image

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

STRESS_BATCH1_PRESENTATION = {
    "act_name": "Indian Contract Act, 1872 & Central GST Act, 2017",
    "section_code": "Section 10, Section 73 & Section 16(2)",
    "core_doctrine": "Statutory Enforcement, Consideration & Default Liability",
    "story_summary": "Stress test with long Malayalam text, long entity names, and large amounts up to ₹99,99,99,999.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Contract Sign (Stress)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കരാറിലെ വ്യവസ്ഥകൾ ലംഘിക്കപ്പെടുമ്പോൾ ഉണ്ടാകുന്ന നഷ്ടപരിഹാര ബാധ്യതകൾ പൂർണ്ണമായും തിട്ടപ്പെടുത്തുന്നു. ഇന്ത്യൻ കരാർ നിയമത്തിലെ ചട്ടങ്ങൾ കൃത്യമായി പാലിക്കേണ്ടതുണ്ട്.",
                    "line_title": "Consortium Agreement Execution",
                    "duration_ms": 5400,
                    "action_type": "contract_sign",
                    "action_payload": {
                        "title": "Comprehensive Tripartite Infrastructure Development Deed",
                        "parties": "M/s. Southern Greenfield Petrochemicals Infrastructure & Logistics Private Limited & Kerala State Industrial Development Corporation (KSIDC)",
                        "key_term": "Mandatory Turnkey EPC Compliance with Sovereign Performance Guarantees totaling ₹99,99,99,999",
                        "stamp_text": "SEALED & REGISTERED"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Handshake Consent (Stress)",
            "layout_archetype": "layout_bilateral_split",
            "layout_payload": {
                "left_label": "M/s. Southern Greenfield Petrochemicals Infrastructure & Logistics Private Limited",
                "left_role": "Principal Concessionaire & Project Proponent",
                "right_label": "Kerala State Industrial Development Corporation (KSIDC) Appellate Authority",
                "right_role": "State Statutory Regulatory & Licensing Body"
            },
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കക്ഷികൾ തമ്മിലുള്ള ഉഭയസമ്മതവും നിയമപരമായ സാധുതയും പരിശോധിച്ചതിന് ശേഷം ഔദ്യോഗിക അംഗീകാരം നൽകുന്നു.",
                    "line_title": "Consensus ad Idem Verification",
                    "duration_ms": 5400,
                    "action_type": "handshake_consent",
                    "action_payload": {
                        "party_a": "M/s. Southern Greenfield Petrochemicals Infrastructure & Logistics Private Limited",
                        "party_b": "Kerala State Industrial Development Corporation (KSIDC) Appellate Authority",
                        "consent_rule": "Free Consent & Competence under Section 10, 11 & 12",
                        "status": "Mutual Free Consent Certified & Unconditional"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Goods Transport (Stress)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "സാമഗ്രികളുടെയും യന്ത്രങ്ങളുടെയും നീക്കം ജിഎസ്ടി ഇ-വേ ബിൽ പ്രകാരം പൂർണ്ണമായും നിരീക്ഷിക്കുന്നു.",
                    "line_title": "High-Value Capital Consignment",
                    "duration_ms": 5400,
                    "action_type": "goods_transport",
                    "action_payload": {
                        "origin": "Central Heavy Engineering Works (Coimbatore Complex)",
                        "destination": "Mega Petrochemical Refining Facility (Kochi SEZ Terminal 4)",
                        "cargo": "High-Precision CNC Automated Milling Equipment (Valued at ₹99,99,99,999)",
                        "delivery_status": "DELIVERED & TRANSFERRED: ₹99,99,99,999 Machinery Consignment"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Breach Block (Stress)",
            "layout_archetype": "layout_hero_stage",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "ചട്ടങ്ങൾ ലംഘിച്ചാൽ നേരിട്ടുള്ള നഷ്ടപരിഹാര ബാധ്യതകൾ നിയമപരമായി ചുമത്തപ്പെടുന്നതാണ്.",
                    "line_title": "Statutory Default Determination",
                    "duration_ms": 5400,
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "Material Default & Failure to Execute Delivery Timeline",
                        "cause": "Inordinate 180-Day Delay in Turnkey Commissioning contrary to Clause 42(a)",
                        "consequence": "Statutory Liquidated Damages of ₹99,99,99,999 Imposed under Section 73 & 74"
                    }
                }
            ]
        }
    ]
}

def main():
    print("Launching Playwright for Batch 1 Stress Tests...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        page.evaluate("""async (data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;
        }""", STRESS_BATCH1_PRESENTATION)

        engines = ["contract_sign", "handshake_consent", "goods_transport", "breach_block"]
        captured_images = []

        for idx, engine_name in enumerate(engines):
            # Capture in Light mode at 100%
            data_url_light = page.evaluate(f"""() => {{
                window.THEME.setMode('light');
                window.PRESENTATION_PLAYER.renderFrame({idx}, 5400);
                return document.getElementById('stage_canvas').toDataURL('image/png');
            }}""")
            light_path = os.path.join(ARTIFACT_DIR, f"stress_batch1_{engine_name}_light.png")
            header, encoded = data_url_light.split(",", 1)
            Image.open(io.BytesIO(base64.b64decode(encoded))).save(light_path)

            # Capture in Dark mode at 100%
            data_url_dark = page.evaluate(f"""() => {{
                window.THEME.setMode('dark');
                window.PRESENTATION_PLAYER.renderFrame({idx}, 5400);
                return document.getElementById('stage_canvas').toDataURL('image/png');
            }}""")
            dark_path = os.path.join(ARTIFACT_DIR, f"stress_batch1_{engine_name}_dark.png")
            header, encoded = data_url_dark.split(",", 1)
            Image.open(io.BytesIO(base64.b64decode(encoded))).save(dark_path)

            captured_images.append((engine_name, light_path, dark_path))
            print(f"Captured stress frames for Batch 1: {engine_name}")

        browser.close()

    # Build 4x2 composite: 4 engines x (Light, Dark)
    cw, ch = 640, 360
    composite = Image.new("RGB", (cw * 2, ch * 4), "#0F172A")
    for r_idx, (engine_name, lpath, dpath) in enumerate(captured_images):
        lim = Image.open(lpath).resize((cw, ch), Image.Resampling.LANCZOS)
        dim = Image.open(dpath).resize((cw, ch), Image.Resampling.LANCZOS)
        composite.paste(lim, (0, r_idx * ch))
        composite.paste(dim, (cw, r_idx * ch))

    composite_path = os.path.join(ARTIFACT_DIR, "composite_stress_test_batch1.png")
    composite.save(composite_path, quality=92)
    print(f"Saved Batch 1 stress composite: {composite_path}")

if __name__ == "__main__":
    main()
