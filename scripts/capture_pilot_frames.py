import os
import sys
import base64
from playwright.sync_api import sync_playwright
from PIL import Image
import io

ARTIFACT_DIR = r"C:\Users\HP\.gemini\antigravity\brain\9efaef3f-d536-49d8-9637-a35c80cd4018"
STUDIO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if STUDIO_DIR not in sys.path:
    sys.path.insert(0, STUDIO_DIR)

from tests.test_frame_reproducibility import SAMPLE_PRESENTATION

PERCENTAGES = [
    ("0pct", 0),
    ("30pct", 1350),
    ("65pct", 2925),
    ("100pct", 4500)
]

ENGINES = [
    (0, "money_transfer"),
    (1, "balance_scale"),
    (2, "gavel_verdict")
]

THEMES = ["light", "dark"]

def capture():
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
        }""", SAMPLE_PRESENTATION)

        captured_images = {}

        for slide_idx, engine_name in ENGINES:
            for theme in THEMES:
                for pct_label, time_ms in PERCENTAGES:
                    # Switch theme & render frame
                    data_url = page.evaluate(f"""() => {{
                        window.THEME.setMode('{theme}');
                        window.PRESENTATION_PLAYER.renderFrame({slide_idx}, {time_ms});
                        return document.getElementById('stage_canvas').toDataURL('image/png');
                    }}""")

                    # Decode base64
                    header, encoded = data_url.split(",", 1)
                    img_bytes = base64.b64decode(encoded)
                    img = Image.open(io.BytesIO(img_bytes))

                    filename = f"pilot_{engine_name}_{pct_label}_{theme}.png"
                    out_path = os.path.join(ARTIFACT_DIR, filename)
                    img.save(out_path)
                    print(f"Saved: {filename}")
                    captured_images[(engine_name, theme, pct_label)] = img

        browser.close()

        # Build 3 Composite Overview Images (1 per engine: 4 stages horizontal for Light, 4 for Dark)
        for _, engine_name in ENGINES:
            # Each canvas is 1080x608 or similar. Let's create a 4-column x 2-row comparison grid
            sample_img = captured_images[(engine_name, "light", "0pct")]
            thumb_w = 480
            thumb_h = int(thumb_w * (sample_img.height / sample_img.width))

            comp_w = thumb_w * 4 + 50
            comp_h = thumb_h * 2 + 100
            composite = Image.new("RGB", (comp_w, comp_h), "#0F172A")

            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(composite)

            for row_idx, theme in enumerate(["light", "dark"]):
                for col_idx, (pct_label, _) in enumerate(PERCENTAGES):
                    src_img = captured_images[(engine_name, theme, pct_label)]
                    resized = src_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                    x = 10 + col_idx * (thumb_w + 10)
                    y = 40 + row_idx * (thumb_h + 30)
                    composite.paste(resized, (x, y))

                    # Label
                    label = f"{pct_label.upper()} ({'ENTER' if pct_label=='0pct' else 'PERFORM' if pct_label=='30pct' else 'SETTLE (Hold >=1.5s)'}) - {theme.upper()}"
                    draw.text((x + 8, y - 22), label, fill="#F8FAFC")

            comp_filename = f"composite_pilot_{engine_name}.png"
            comp_path = os.path.join(ARTIFACT_DIR, comp_filename)
            composite.save(comp_path)
            print(f"Generated Composite: {comp_filename}")

if __name__ == '__main__':
    capture()
