# -*- coding: utf-8 -*-
"""
Multi-Statute Integration Script
Runs end-to-end generation for:
1. Indian Contract Act, 1872 (Section 73)
2. Income Tax Act, 1961 (Section 45 / 48)
3. Central Goods and Services Tax Act, 2017 (Section 16)

Saves raw Gemini JSON, performs detailed missing-field delta analysis,
and captures Light & Dark screenshots for all scenes via Playwright.
"""
import os
import sys
import json
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from pipeline.key_rotator import KeyRotator
from pipeline.story_choreographer import generate_story_screenplay, validate_and_sanitize_screenplay

STATUTES = [
    {
        "id": "contract_act_sec73",
        "name": "Indian Contract Act, 1872",
        "section": "Section 73",
        "hint": "Breach of supply contract for machinery, direct operational losses vs remote speculative damages.",
        "text": """
Section 73: Compensation for loss or damage caused by breach of contract.
When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it.
Such compensation is not to be given for any remote and indirect loss or damage sustained by reason of the breach.
In estimating the loss or damage arising from a breach of contract, the means which existed of remedying the inconvenience caused by the non-performance of the contract must be taken into account.
Factual context: A commercial supply contract where delivery of machinery was delayed, causing the buyer to suffer an established quantified loss of ₹2,00,000 in direct factory idle time.
"""
    },
    {
        "id": "incometax_sec45_48",
        "name": "Income Tax Act, 1961",
        "section": "Section 45 read with Section 48",
        "hint": "Capital gains computation on transfer of capital asset, deducting cost of acquisition and transfer expenses.",
        "text": """
Section 45(1) read with Section 48: Mode of computation of Capital Gains.
Any profits or gains arising from the transfer of a capital asset effected in the previous year shall be chargeable to income-tax under the head 'Capital gains'.
The income chargeable under the head 'Capital gains' shall be computed by deducting from the full value of the consideration received or accruing as a result of the transfer of the capital asset:
(i) expenditure incurred wholly and exclusively in connection with such transfer;
(ii) the cost of acquisition of the asset and the cost of any improvement thereto.
Factual context: Transfer of capital asset for gross consideration of ₹1,50,00,000 with cost of acquisition of ₹60,00,000 and transfer expenses of ₹5,00,000, leaving net taxable capital gain of ₹85,00,000.
"""
    },
    {
        "id": "cgst_sec16",
        "name": "Central Goods and Services Tax Act, 2017",
        "section": "Section 16",
        "hint": "Four mandatory statutory conditions for eligibility of Input Tax Credit (ITC) and reversal on failure.",
        "text": """
Section 16: Eligibility and conditions for taking input tax credit.
(1) Every registered person shall be entitled to take credit of input tax charged on any supply of goods or services or both to him which are used or intended to be used in the course or furtherance of his business.
(2) Notwithstanding anything contained in this section, no registered person shall be entitled to the credit of any input tax in respect of any supply of goods or services or both to him unless:
(a) he is in possession of a tax invoice or debit note issued by a supplier registered under this Act;
(b) he has received the goods or services or both;
(c) subject to the provisions of section 38 or section 41, the tax charged in respect of such supply has been actually paid to the Government, either in cash or through utilization of input tax credit admissible in respect of the said supply; and
(d) he has furnished the return under section 39.
Factual context: Recipient claimed ITC of ₹18,00,000 on purchase of ₹1,00,00,000, but supplier defaulted on depositing tax with the government, triggering statutory notice and limitation inquiry.
"""
    }
]


def analyze_missing_fields(raw_data, validated_data):
    """
    Compares raw Gemini JSON against validated screenplay.
    Identifies fields that were missing or empty in Gemini output and filled by validator.
    """
    missing_report = []

    raw_scenes = raw_data.get("scenes", []) if isinstance(raw_data, dict) else (raw_data if isinstance(raw_data, list) else [])
    val_scenes = validated_data.get("scenes", [])

    for s_idx, v_scene in enumerate(val_scenes):
        r_scene = raw_scenes[s_idx] if s_idx < len(raw_scenes) and isinstance(raw_scenes[s_idx], dict) else {}

        # Check layout payload
        v_lp = v_scene.get("layout_payload", {})
        r_lp = r_scene.get("layout_payload", {}) if isinstance(r_scene.get("layout_payload"), dict) else {}
        for k, v in v_lp.items():
            if k not in r_lp or r_lp[k] is None or r_lp[k] == "":
                missing_report.append({
                    "scene_idx": s_idx + 1,
                    "target": "layout_payload",
                    "field": k,
                    "filled_value": str(v)[:60]
                })

        # Check lines and action payloads
        v_lines = v_scene.get("lines", [])
        r_lines = r_scene.get("lines", []) if isinstance(r_scene.get("lines"), list) else []

        for l_idx, v_line in enumerate(v_lines):
            r_line = r_lines[l_idx] if l_idx < len(r_lines) and isinstance(r_lines[l_idx], dict) else {}
            v_ap = v_line.get("action_payload", {})
            r_ap = r_line.get("action_payload", {}) if isinstance(r_line.get("action_payload"), dict) else {}

            action_type = v_line.get("action_type")

            # Check new specific fields
            key_fields = ["numeric_value", "max_value", "direction", "elapsed", "limit", "unit", "tiers", "conditions", "status"]
            for kf in key_fields:
                if kf in v_ap and (kf not in r_ap or r_ap[kf] is None or r_ap[kf] == ""):
                    missing_report.append({
                        "scene_idx": s_idx + 1,
                        "line_idx": l_idx + 1,
                        "action_type": action_type,
                        "field": kf,
                        "filled_value": str(v_ap[kf])[:60]
                    })

    return missing_report


def main():
    os.makedirs("data", exist_ok=True)
    os.makedirs("screenshots", exist_ok=True)

    rotator = KeyRotator()
    results = {}

    print("\n" + "=" * 80)
    print("STEP 1: GENERATING SCREENPLAYS & SAVING RAW GEMINI JSON FOR 3 STATUTES")
    print("=" * 80)

    for item in STATUTES:
        statute_id = item["id"]
        raw_path = f"data/raw_gemini_{statute_id}.json"
        val_path = f"data/validated_{statute_id}.json"

        print(f"\n--> Processing {item['name']} ({item['section']})...")
        screenplay = generate_story_screenplay(
            rotator=rotator,
            provision_text=item["text"],
            topic_hint=item["hint"],
            raw_json_save_path=raw_path
        )

        with open(val_path, "w", encoding="utf-8") as f:
            json.dump(screenplay, f, indent=2, ensure_ascii=False)

        # Load raw for delta analysis
        with open(raw_path, "r", encoding="utf-8") as f:
            raw_json = json.load(f)

        missing_fields = analyze_missing_fields(raw_json, screenplay)
        results[statute_id] = {
            "name": item["name"],
            "section": item["section"],
            "raw_path": raw_path,
            "val_path": val_path,
            "screenplay": screenplay,
            "missing_fields": missing_fields
        }

        print(f"    * Saved Raw JSON: {raw_path}")
        print(f"    * Saved Validated: {val_path}")
        print(f"    * Total Scenes: {len(screenplay.get('scenes', []))}")
        print(f"    * Validator Filled Fields: {len(missing_fields)}")
        for mf in missing_fields[:5]:
            print(f"      - Scene {mf['scene_idx']} [{mf.get('action_type', mf.get('target'))}]: filled '{mf['field']}' = {mf['filled_value']}")
        if len(missing_fields) > 5:
            print(f"      - ... and {len(missing_fields) - 5} more fields")

    print("\n" + "=" * 80)
    print("STEP 2: CAPTURING LIGHT & DARK SCREENSHOTS VIA PLAYWRIGHT")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        page.evaluate("""async () => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
        }""")

        for statute_id, res in results.items():
            screenplay = res["screenplay"]
            scenes = screenplay.get("scenes", [])
            print(f"\n--> Rendering {res['name']} ({len(scenes)} scenes)...")

            # Load presentation into player
            page.evaluate("(data) => window.PRESENTATION_PLAYER.loadPresentation(data)", screenplay)
            page.wait_for_timeout(200)

            for s_idx, scene in enumerate(scenes):
                arch = scene.get("layout_archetype", "layout_hero_stage")
                first_line = scene.get("lines", [{}])[0]
                action_type = first_line.get("action_type", "neutral_action")

                # Settle at 100% time
                # Render Light Mode
                page.evaluate(f"""() => {{
                    window.THEME.setTheme('light');
                    const player = window.PRESENTATION_PLAYER;
                    const slide = player.data.scenes[{s_idx}];
                    const dur = player.getSlideDurationMs(slide);
                    player.renderFrame({s_idx}, dur);
                }}""")
                page.wait_for_timeout(100)
                light_file = f"screenshots/{statute_id}_scene_{s_idx+1}_light.png"
                canvas_elem = page.locator("#stage_canvas")
                canvas_elem.screenshot(path=light_file)

                # Render Dark Mode
                page.evaluate(f"""() => {{
                    window.THEME.setTheme('dark');
                    const player = window.PRESENTATION_PLAYER;
                    const slide = player.data.scenes[{s_idx}];
                    const dur = player.getSlideDurationMs(slide);
                    player.renderFrame({s_idx}, dur);
                }}""")
                page.wait_for_timeout(100)
                dark_file = f"screenshots/{statute_id}_scene_{s_idx+1}_dark.png"
                canvas_elem.screenshot(path=dark_file)

                print(f"  * Scene {s_idx+1} ({arch} / {action_type}): captured {light_file} & {dark_file}")

        browser.close()

    print("\n" + "=" * 80)
    print("STEP 3: MULTI-STATUTE INTEGRATION SUMMARY")
    print("=" * 80)
    summary_report = {
        "statutes": []
    }
    for statute_id, res in results.items():
        stat_summary = {
            "id": statute_id,
            "name": res["name"],
            "section": res["section"],
            "scenes_count": len(res["screenplay"].get("scenes", [])),
            "raw_json_file": res["raw_path"],
            "missing_fields_filled_by_validator": len(res["missing_fields"]),
            "details": res["missing_fields"]
        }
        summary_report["statutes"].append(stat_summary)

    with open("data/multi_statute_integration_report.json", "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2, ensure_ascii=False)

    print("Successfully generated data/multi_statute_integration_report.json")
    print("All 3 statutes generated, saved, validated, and screen-captured.")


if __name__ == "__main__":
    main()
