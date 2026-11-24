# -*- coding: utf-8 -*-
import os
import sys
import time
import unittest
from playwright.sync_api import sync_playwright
from tests.test_frame_reproducibility import SAMPLE_PRESENTATION


def calc_percentile(data, p):
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_data) - 1)
    d = k - f
    return sorted_data[f] * (1 - d) + sorted_data[c] * d


class TestPerformance60fps(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)
        cls.page = cls.browser.new_page(viewport={"width": 1280, "height": 800})
        cls.page.goto("http://localhost:8090/static/index.html")
        cls.page.wait_for_selector("#stage_canvas", state="attached")

        # Load presentation and prepare instrumentation
        cls.page.evaluate("""async (data) => {
            document.getElementById('animation_section').style.display = 'flex';
            window.PRESENTATION_PLAYER.init();
            if (window.THEME) await window.THEME.ensureFontsLoaded();
            if (document.fonts) await document.fonts.ready;
            window.PRESENTATION_PLAYER.loadPresentation(data);
            window.PRESENTATION_PLAYER.isPlaying = false;

            // Instrument renderFrame to record execution time of every frame drawn
            window.__frameTimes = [];
            const originalRenderFrame = window.PRESENTATION_PLAYER.renderFrame.bind(window.PRESENTATION_PLAYER);
            window.PRESENTATION_PLAYER.renderFrame = function(slideIdx, timeMs, overrideCtx) {
                const t0 = performance.now();
                originalRenderFrame(slideIdx, timeMs, overrideCtx);
                const dt = performance.now() - t0;
                window.__frameTimes.push(dt);
            };
        }""", SAMPLE_PRESENTATION)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def run_slide_benchmark(self, slide_idx, duration_sec, cpu_throttle_rate=1):
        """
        Runs animation loop on the given slide for `duration_sec`, measuring every frame execution time.
        Optionally applies CDP CPU throttling.
        """
        cdp_client = None
        if cpu_throttle_rate > 1:
            cdp_client = self.page.context.new_cdp_session(self.page)
            cdp_client.send("Emulation.setCPUThrottlingRate", {"rate": cpu_throttle_rate})

        try:
            # Reset frame times and start continuous looped playback for slide_idx
            self.page.evaluate(f"""(slideIdx) => {{
                window.__frameTimes = [];
                window.__benchmarkRunning = true;
                const player = window.PRESENTATION_PLAYER;
                player.currentSlideIdx = slideIdx;
                player.currentTimeMs = 0;
                player.isPlaying = true;

                // Loop slide when it reaches end during benchmark
                const slide = player.data.scenes[slideIdx];
                const maxMs = player.getSlideDurationMs(slide);

                if (window.__benchInterval) clearInterval(window.__benchInterval);
                window.__benchInterval = setInterval(() => {{
                    if (player.currentTimeMs >= maxMs) {{
                        player.currentTimeMs = 0;
                    }}
                }}, 50);
            }}""", slide_idx)

            time.sleep(duration_sec)

            # Stop benchmark
            frame_times = self.page.evaluate("""() => {
                const player = window.PRESENTATION_PLAYER;
                player.isPlaying = false;
                if (window.__benchInterval) clearInterval(window.__benchInterval);
                window.__benchmarkRunning = false;
                return window.__frameTimes || [];
            }""")

            return frame_times

        finally:
            if cdp_client:
                cdp_client.send("Emulation.setCPUThrottlingRate", {"rate": 1})
                cdp_client.detach()

    def test_slide_30s_60fps_benchmark_normal_and_throttled(self):
        """
        Record frame times for 30s per slide on representative complex engine (waterfall_flow),
        report p95 under 16.7ms for 60fps, also with 4x CPU throttle.
        """
        # Duration can be controlled via env var, default 30s
        duration_sec = float(os.environ.get("BENCHMARK_SLIDE_DURATION", "30.0"))
        slide_idx = 15  # waterfall_flow (complex multi-tier canvas engine)
        action_name = SAMPLE_PRESENTATION["scenes"][slide_idx]["lines"][0]["action_type"]

        print("\n" + "=" * 78)
        print(f"60FPS BENCHMARK: 30s DURATION - ENGINE: {action_name.upper()}")
        print("=" * 78)

        # 1. Normal Speed (1x)
        print(f"\n[1] Running {duration_sec}s continuous benchmark at normal CPU speed...")
        t0 = time.time()
        frames_normal = self.run_slide_benchmark(slide_idx, duration_sec, cpu_throttle_rate=1)
        elapsed_normal = time.time() - t0

        self.assertGreater(len(frames_normal), 100, "Should have recorded hundreds of frames in 30s")
        p50_norm = calc_percentile(frames_normal, 50)
        p95_norm = calc_percentile(frames_normal, 95)
        p99_norm = calc_percentile(frames_normal, 99)
        max_norm = max(frames_normal) if frames_normal else 0
        mean_norm = sum(frames_normal) / len(frames_normal) if frames_normal else 0
        fps_norm = len(frames_normal) / elapsed_normal

        print(f"  * Total Frames Rendered : {len(frames_normal)} frames in {elapsed_normal:.2f}s (~{fps_norm:.1f} fps)")
        print(f"  * Frame Render Time Mean: {mean_norm:.2f} ms")
        print(f"  * Frame Render Time p50 : {p50_norm:.2f} ms")
        print(f"  * Frame Render Time p95 : {p95_norm:.2f} ms (Target: <= 16.7 ms for 60fps)")
        print(f"  * Frame Render Time p99 : {p99_norm:.2f} ms")
        print(f"  * Frame Render Time Max : {max_norm:.2f} ms")

        self.assertLessEqual(p95_norm, 16.7, f"p95 frame time ({p95_norm:.2f}ms) must be under 16.7ms for 60fps")

        # 2. 4x CPU Throttled
        print(f"\n[2] Running {duration_sec}s continuous benchmark with 4x CPU Throttling (CDP)...")
        t0 = time.time()
        frames_throttled = self.run_slide_benchmark(slide_idx, duration_sec, cpu_throttle_rate=4)
        elapsed_throttled = time.time() - t0

        self.assertGreater(len(frames_throttled), 100, "Should have recorded hundreds of frames under 4x throttle")
        p50_throt = calc_percentile(frames_throttled, 50)
        p95_throt = calc_percentile(frames_throttled, 95)
        p99_throt = calc_percentile(frames_throttled, 99)
        max_throt = max(frames_throttled) if frames_throttled else 0
        mean_throt = sum(frames_throttled) / len(frames_throttled) if frames_throttled else 0
        fps_throt = len(frames_throttled) / elapsed_throttled

        print(f"  * Total Frames Rendered : {len(frames_throttled)} frames in {elapsed_throttled:.2f}s (~{fps_throt:.1f} fps)")
        print(f"  * Frame Render Time Mean: {mean_throt:.2f} ms")
        print(f"  * Frame Render Time p50 : {p50_throt:.2f} ms")
        print(f"  * Frame Render Time p95 : {p95_throt:.2f} ms (Target: <= 16.7 ms for 60fps)")
        print(f"  * Frame Render Time p99 : {p99_throt:.2f} ms")
        print(f"  * Frame Render Time Max : {max_throt:.2f} ms")

        self.assertLessEqual(p95_throt, 16.7, f"p95 frame time under 4x throttle ({p95_throt:.2f}ms) must be under 16.7ms")
        print("\n" + "=" * 78)
        print("60FPS BENCHMARK PASSED (Both 1x and 4x Throttle p95 <= 16.7ms)")
        print("=" * 78)

    def test_all_16_engines_frame_budget_p95(self):
        """
        Evaluates 60 frames across the animation timeline for ALL 16 built engines.
        Asserts that every single engine satisfies p95 <= 16.7ms for 60fps budget.
        """
        total_slides = len(SAMPLE_PRESENTATION["scenes"])
        print("\n" + "=" * 78)
        print("ALL 16 ENGINES FRAME BUDGET VERIFICATION (60 frames per engine):")
        print("=" * 78)

        for slide_idx in range(total_slides):
            action_type = SAMPLE_PRESENTATION["scenes"][slide_idx]["lines"][0]["action_type"]

            frame_times = self.page.evaluate(f"""() => {{
                window.__frameTimes = [];
                const player = window.PRESENTATION_PLAYER;
                const slide = player.data.scenes[{slide_idx}];
                const dur = player.getSlideDurationMs(slide);
                const step = dur / 60;

                for (let i = 0; i < 60; i++) {{
                    player.renderFrame({slide_idx}, i * step);
                }}
                return window.__frameTimes || [];
            }}""")

            p50 = calc_percentile(frame_times, 50)
            p95 = calc_percentile(frame_times, 95)
            p99 = calc_percentile(frame_times, 99)
            mean_val = sum(frame_times) / len(frame_times) if frame_times else 0

            print(f"  * Engine {slide_idx+1:02d} ({action_type:<19}): 60 frames | Mean: {mean_val:.2f}ms | p50: {p50:.2f}ms | p95: {p95:.2f}ms")
            self.assertLessEqual(p95, 16.7, f"Engine {action_type} p95 frame time ({p95:.2f}ms) must be <= 16.7ms")


if __name__ == "__main__":
    unittest.main()

