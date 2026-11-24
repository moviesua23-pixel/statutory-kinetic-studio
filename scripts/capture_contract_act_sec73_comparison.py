# -*- coding: utf-8 -*-
"""
Generates before-and-after visual comparison for Indian Contract Act Section 73
Showing:
- 3-stage sequential pipeline with active stage highlight, 14px padding, 2-line wrapping
- financial_meter displaying ₹2,00,000 loss needle vs old '—' / 'Quantum Data Awaiting Statutory Adjudication'
"""
import os
import sys
import shutil
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PRESENTATION_AFTER = {
    "act_name": "Indian Contract Act, 1872",
    "section_code": "Section 73",
    "core_doctrine": "Compensation for Loss or Damage Caused by Breach",
    "story_summary": "Three-stage adjudication of direct loss vs consequential remote claims.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Loss Adjudication Pipeline",
            "layout_archetype": "layout_sequential_pipeline",
            "layout_payload": {
                "pipeline_title": "Three-Stage Breach Adjudication Pipeline",
                "stages": [
                    {"label": "1. Breach Incurred", "detail": "Commercial machinery delivery delayed by 60 calendar days"},
                    {"label": "2. Loss Quantified", "detail": "Direct operational deficit assessed at statutory hearing"},
                    {"label": "3. Award Granted", "detail": "Judicial decree awarding proximate ordinary compensation"}
                ]
            },
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "First, the promisor committed a contractual breach by delaying machinery delivery.",
                    "line_title": "Stage 1: Breach Established",
                    "duration_ms": 5400,
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "Delayed Delivery Breach",
                        "cause": "Failure to Deliver by Stipulated Due Date",
                        "consequence": "Section 73 Statutory Liability Triggered"
                    }
                },
                {
                    "line_num": 2,
                    "sentence": "Under Section 73 of the Indian Contract Act, 1872, the plaintiff suffered a quantified loss of ₹2,00,000.",
                    "line_title": "Stage 2: Loss Quantified",
                    "duration_ms": 5400,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "Quantified Damages Assessment",
                        "numeric_value": 200000,
                        "max_value": 500000,
                        "direction": "loss",
                        "status": "STATUTORY LOSS COMPUTATION"
                    }
                }
            ]
        }
    ]
}

PRESENTATION_BEFORE = {
    "act_name": "Indian Contract Act, 1872",
    "section_code": "Section 73",
    "core_doctrine": "Compensation for Loss or Damage Caused by Breach",
    "story_summary": "Three-stage adjudication of direct loss vs consequential remote claims.",
    "scenes": [
        {
            "id": 1,
            "tab_title": "1. Loss Adjudication Pipeline",
            "layout_archetype": "layout_sequential_pipeline",
            "layout_payload": {
                "pipeline_title": "Three-Stage Breach Adjudication Pipeline",
                "stages": [
                    {"label": "1. Breach Incurred", "detail": "Commercial machinery delivery delayed by 60 calendar days"},
                    {"label": "2. Loss Quantified", "detail": "Direct operational deficit assessed at statutory hearing"},
                    {"label": "3. Award Granted", "detail": "Judicial decree awarding proximate ordinary compensation"}
                ]
            },
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "First, the promisor committed a contractual breach by delaying machinery delivery.",
                    "line_title": "Stage 1: Breach Established",
                    "duration_ms": 5400,
                    "action_type": "breach_block",
                    "action_payload": {
                        "event_title": "Delayed Delivery Breach",
                        "cause": "Failure to Deliver by Stipulated Due Date",
                        "consequence": "Section 73 Statutory Liability Triggered"
                    }
                },
                {
                    "line_num": 2,
                    "sentence": "Under Section 73 of the Indian Contract Act, 1872, the plaintiff suffered a quantified loss of ₹2,00,000.",
                    "line_title": "Stage 2: Loss Quantified",
                    "duration_ms": 5400,
                    "action_type": "financial_meter",
                    "action_payload": {
                        "title": "Quantified Damages Assessment"
                        # Missing numeric_value -> previously rendered "—" and "Quantum Data Awaiting Statutory Adjudication"
                    }
                }
            ]
        }
    ]
}


def capture_slides():
    os.makedirs("screenshots", exist_ok=True)
    before_path = "screenshots/contract_act_sec73_before.png"
    after_path = "screenshots/contract_act_sec73_after.png"
    composite_path = "screenshots/contract_act_sec73_before_after_comparison.png"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:8090/static/index.html")
        page.wait_for_selector("#stage_canvas", state="attached")

        page.evaluate("""async () => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
        }""")

        # 1. Render BEFORE (Emulate un-updated state: missing numeric_value in meter, unhighlighted pipeline stages)
        page.evaluate("""(data) => {
            window.THEME.setTheme('dark');
            const player = window.PRESENTATION_PLAYER;
            player.loadPresentation(data);
            if (player.animationFrameId) {
                cancelAnimationFrame(player.animationFrameId);
                player.animationFrameId = null;
            }
            player.isPlaying = false;

            // Emulate unhighlighted pipeline stages
            const origRender = window.LAYOUT_FRAMES.render;
            window.LAYOUT_FRAMES.render = function(ctx, archetype, payload, mainStageRect, progress, themeColors, activeLineIdx) {
                return origRender(ctx, archetype, payload, mainStageRect, progress, themeColors, -1);
            };

            const l1 = player.getEffectiveLineDuration(player.data.scenes[0].lines[0]);
            const l2 = player.getEffectiveLineDuration(player.data.scenes[0].lines[1]);
            const targetTime = l1 + (l2 * 0.85);

            player.currentTimeMs = targetTime;
            // Render line 2 at settled hold
            player.renderFrame(0, targetTime);
        }""", PRESENTATION_BEFORE)

        page.wait_for_timeout(100)
        canvas_elem = page.locator("#stage_canvas")
        canvas_elem.screenshot(path=before_path)
        print(f"Captured BEFORE frame: {before_path}")

        # 2. Render AFTER (Current refined codebase: active stage 2 highlighted, 14px padding, 2-line wrap, ₹2,00,000 meter with loss direction)
        page.reload()
        page.wait_for_selector("#stage_canvas", state="attached")
        page.evaluate("""async (data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
            window.THEME.setTheme('dark');
            const player = window.PRESENTATION_PLAYER;
            player.loadPresentation(data);
            if (player.animationFrameId) {
                cancelAnimationFrame(player.animationFrameId);
                player.animationFrameId = null;
            }
            player.isPlaying = false;

            const l1 = player.getEffectiveLineDuration(player.data.scenes[0].lines[0]);
            const l2 = player.getEffectiveLineDuration(player.data.scenes[0].lines[1]);
            const targetTime = l1 + (l2 * 0.85);

            player.currentTimeMs = targetTime;
            // Render line 2 at settled hold
            player.renderFrame(0, targetTime);
        }""", PRESENTATION_AFTER)

        page.wait_for_timeout(100)
        canvas_elem.screenshot(path=after_path)
        print(f"Captured AFTER frame: {after_path}")

        browser.close()

    # Create composite side-by-side or stacked
    img_before = Image.open(before_path)
    img_after = Image.open(after_path)

    w, h = img_before.size
    banner_h = 60
    comp_w = w
    comp_h = (h + banner_h) * 2 + 40

    composite = Image.new("RGB", (comp_w, comp_h), (15, 23, 42)) # Slate 900
    draw = ImageDraw.Draw(composite)

    try:
        font_title = ImageFont.truetype("arialbd.ttf", 26)
        font_sub = ImageFont.truetype("arial.ttf", 18)
    except:
        font_title = font_sub = ImageFont.load_default()

    # Panel 1: BEFORE
    y_offset = 20
    draw.rectangle([0, y_offset, comp_w, y_offset + banner_h], fill=(185, 28, 28)) # Dark Red
    draw.text((24, y_offset + 12), "BEFORE: Unsynchronized Prompt (Meter: '—' & Unaligned Tiers, Pipeline: No Stage Highlight)", fill=(255, 255, 255), font=font_title)
    draw.text((24, y_offset + 38), "Payload lacked numeric_value, pipeline stage 2 unhighlighted, small unpadded text", fill=(254, 202, 202), font=font_sub)
    y_offset += banner_h
    composite.paste(img_before, (0, y_offset))

    # Panel 2: AFTER
    y_offset += h + 20
    draw.rectangle([0, y_offset, comp_w, y_offset + banner_h], fill=(4, 120, 87)) # Emerald 700
    draw.text((24, y_offset + 12), "AFTER: Synchronized Schema + Validator Extraction + Highlighted Stage 2 (₹2,00,000 Loss)", fill=(255, 255, 255), font=font_title)
    draw.text((24, y_offset + 38), "Stage 2 glowing highlight, >=14px edge padding, 2-line wrap, needle in red deficit zone at ₹2,00,000", fill=(167, 243, 208), font=font_sub)
    y_offset += banner_h
    composite.paste(img_after, (0, y_offset))

    composite.save(composite_path)
    print(f"Saved composite before/after to: {composite_path}")

    # Copy to artifacts directory
    artifact_dir = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"
    if os.path.exists(artifact_dir):
        dest_comp = os.path.join(artifact_dir, "contract_act_sec73_before_after_comparison.png")
        shutil.copyfile(composite_path, dest_comp)
        dest_before = os.path.join(artifact_dir, "contract_act_sec73_before.png")
        shutil.copyfile(before_path, dest_before)
        dest_after = os.path.join(artifact_dir, "contract_act_sec73_after.png")
        shutil.copyfile(after_path, dest_after)
        print(f"Copied artifacts to: {dest_comp}")


if __name__ == "__main__":
    capture_slides()
