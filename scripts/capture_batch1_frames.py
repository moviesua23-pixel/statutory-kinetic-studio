import os
import sys
import base64
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
import io

STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if STUDIO_DIR not in sys.path:
    sys.path.insert(0, STUDIO_DIR)

ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"

BATCH1_PRESENTATION = {
    "act_name": "Indian Contract Act, 1872 & Sale of Goods Act, 1930",
    "section_code": "Section 10, Section 73 & Section 31",
    "core_doctrine": "Lifecycle of Commercial Contracts: From Consent to Breach",
    "story_summary": "Comprehensive 4-step demonstration of contract signing, consent, transport, and breach.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Execution of Contract",
            "layout_archetype": "layout_hero_stage",
            "layout_payload": {
                "hero_headline": "Execution & Formal Registration of Deed",
                "focal_element": "Signed Contract"
            },
            "dialogue": "കരാർ പത്രത്തിൽ വ്യവസ്ഥകൾ രേഖപ്പെടുത്തി ഇരുപാർട്ടികളും ഔദ്യോഗികമായി ഒപ്പുവെക്കുന്നു.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "കരാർ പത്രത്തിൽ വ്യവസ്ഥകൾ രേഖപ്പെടുത്തി ഇരുപാർട്ടികളും ഔദ്യോഗികമായി ഒപ്പുവെക്കുന്നു.",
                    "line_title": "Document Execution",
                    "duration_ms": 4500,
                    "action_type": "contract_sign",
                    "action_payload": {
                        "title": "Commercial Supply Agreement",
                        "parties": "Atlas Logistics & Paramount Exports",
                        "key_term": "Timely Delivery with Liquidated Damages",
                        "stamp_text": "SIGNED & REGISTERED"
                    }
                }
            ]
        },
        {
            "id": 2,
            "tab_title": "2. Mutual Free Consent",
            "layout_archetype": "layout_bilateral_split",
            "layout_payload": {
                "left_label": "Atlas Logistics (Promisor)",
                "left_role": "Commercial Fleet Supplier",
                "right_label": "Paramount Exports (Promisee)",
                "right_role": "Consignee & Buyer"
            },
            "dialogue": "സമ്മർദ്ദങ്ങളോ തെറ്റിദ്ധാരണകളോ ഇല്ലാതെ ഇരു കക്ഷികളും സ്വതന്ത്ര സമ്മതത്തോടെ കരാറിലെത്തി.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "സമ്മർദ്ദങ്ങളോ തെറ്റിദ്ധാരണകളോ ഇല്ലാതെ ഇരു കക്ഷികളും സ്വതന്ത്ര സമ്മതത്തോടെ കരാറിലെത്തി.",
                    "line_title": "Consensus ad Idem",
                    "duration_ms": 4500,
                    "action_type": "handshake_consent",
                    "action_payload": {
                        "party_a": "Atlas Logistics",
                        "party_b": "Paramount Exports",
                        "consent_rule": "Free Consent (Section 10)",
                        "status": "No Coercion, Fraud or Mistake"
                    }
                }
            ]
        },
        {
            "id": 3,
            "tab_title": "3. Goods Transport & Supply",
            "layout_archetype": "layout_hero_stage",
            "layout_payload": {
                "hero_headline": "Physical Transit Across Commercial Corridors",
                "focal_element": "Cargo Transit"
            },
            "dialogue": "നിശ്ചിത സമയപരിധിക്കുള്ളിൽ ചരക്കുകൾ വെയർഹൗസിൽ നിന്നും തുറമുഖത്തേക്ക് അയച്ചു.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "നിശ്ചിത സമയപരിധിക്കുള്ളിൽ ചരക്കുകൾ വെയർഹൗസിൽ നിന്നും തുറമുഖത്തേക്ക് അയച്ചു.",
                    "line_title": "Highway Delivery",
                    "duration_ms": 4500,
                    "action_type": "goods_transport",
                    "action_payload": {
                        "origin": "Central Depot (Kochi)",
                        "destination": "Vallarpadam Terminal",
                        "cargo": "Containerized Machinery (₹2.5 Cr)",
                        "status": "Delivery in Transit"
                    }
                }
            ]
        },
        {
            "id": 4,
            "tab_title": "4. Contractual Breach & Roadblock",
            "layout_archetype": "layout_hero_stage",
            "layout_payload": {
                "hero_headline": "Disruption & Breach of Performance Obligation",
                "focal_element": "Breach Barrier"
            },
            "dialogue": "വാഗ്ദാനം പാലിക്കപ്പെടാതെ വഴിമധ്യേ ചരക്കുനീക്കം തടസ്സപ്പെടുകയും കരാർ ലംഘനം സംഭവിക്കുകയും ചെയ്തു.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "വാഗ്ദാനം പാലിക്കപ്പെടാതെ വഴിമധ്യേ ചരക്കുനീക്കം തടസ്സപ്പെടുകയും കരാർ ലംഘനം സംഭവിക്കുകയും ചെയ്തു.",
                    "line_title": "Breach of Covenant",
                    "duration_ms": 4500,
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "Material Breach of Delivery Term",
                        "cause": "Unjustified Refusal to Offload at Destination",
                        "consequence": "Section 73 Ordinary Damages Compensation Claimable"
                    }
                }
            ]
        }
    ]
}

PERCENTAGES = [
    ("0pct", 0),
    ("30pct", 1350),
    ("65pct", 2925),
    ("100pct", 4500)
]

ENGINES = [
    (0, "contract_sign"),
    (1, "handshake_consent"),
    (2, "goods_transport"),
    (3, "breach_block")
]

def capture_batch1():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        # Load presentation
        page.evaluate("""(data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;
        }""", BATCH1_PRESENTATION)

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
                    filename = f"batch1_{engine_name}_{pct_label}_{theme}.png"
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
                for col_idx, (pct_label, _) in enumerate(PERCENTAGES):
                    src_img = captured[(engine_name, theme, pct_label)]
                    resized = src_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                    x = 10 + col_idx * (thumb_w + 10)
                    y = 40 + row_idx * (thumb_h + 30)
                    comp.paste(resized, (x, y))

                    tag = f"{pct_label.upper()} ({'ENTER' if pct_label=='0pct' else 'PERFORM' if pct_label=='30pct' else 'SETTLE (Hold >=1.5s)'}) - {theme.upper()}"
                    draw.text((x + 8, y - 22), tag, fill="#F8FAFC")

            comp_path = os.path.join(ARTIFACT_DIR, f"composite_batch1_{engine_name}.png")
            comp.save(comp_path)
            print(f"Generated Composite: composite_batch1_{engine_name}.png")

        browser.close()

if __name__ == '__main__':
    capture_batch1()
