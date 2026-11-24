import os
import sys
import time
from typing import Dict, Any, Optional, Callable
from .key_rotator import KeyRotator
from .story_choreographer import generate_story_screenplay
from .voice_synthesizer import synthesize_scene_audio
from .timing_aligner import analyze_audio_sentence_timings, synchronize_scene_elements

class StatutoryStudioOrchestrator:
    def __init__(self, static_audio_dir: str):
        self.static_audio_dir = static_audio_dir
        self.rotator = KeyRotator()

    def generate_story_only(self, provision_text: str, topic_hint: Optional[str] = None, raw_json_save_path: Optional[str] = None) -> Dict[str, Any]:
        """Step 1 Focus: Generates purely the 2-Phase Pedagogical Story Screenplay for any legal provision."""
        return generate_story_screenplay(
            rotator=self.rotator,
            provision_text=provision_text,
            topic_hint=topic_hint,
            raw_json_save_path=raw_json_save_path
        )

    def process_provision(
        self,
        provision_text: str,
        topic_hint: Optional[str] = None,
        voice_name: str = "Aoede",
        progress_callback: Optional[Callable[[str, int], None]] = None
    ) -> Dict[str, Any]:
        """
        Full End-to-End Orchestration Pipeline:
        1. Provision parsing & 2-Phase Pedagogical Story Generation
        2. Expressive Voice TTS Audio Synthesis
        3. Acoustic Voice Timing Analysis
        4. Layout & Shape Synchronization
        """
        def report(msg: str, step: int):
            print(f"[PIPELINE STEP {step}/4] {msg}", flush=True)
            if progress_callback:
                progress_callback(msg, step)

        # STEP 1: 2-Phase Pedagogical Story Choreography
        report("Generating 2-Phase Pedagogical Story Screenplay with Gemini...", 1)
        presentation = self.generate_story_only(
            provision_text=provision_text,
            topic_hint=topic_hint
        )

        scenes = presentation.get("scenes", [])
        total_scenes = len(scenes)

        # STEP 2 & 3: Voice Synthesis & Acoustic Timing Analysis
        report(f"Synthesizing Expressive Voice ('{voice_name}') & Analyzing Timing...", 2)
        for idx, sc in enumerate(scenes):
            dialogue = sc.get("dialogue") or sc.get("story_narration") or ""
            if not dialogue:
                continue

            # Voice Synthesis
            audio_path, audio_url, dur_ms = synthesize_scene_audio(
                rotator=self.rotator,
                dialogue=dialogue,
                output_dir=self.static_audio_dir,
                scene_idx=idx,
                voice_name=voice_name
            )
            sc["audio_url"] = audio_url
            sc["duration_ms"] = dur_ms

            # Timing Analysis & Layout Sync
            report(f"Analyzing Acoustic Timing & Syncing Shapes for Scene {idx+1}/{total_scenes}...", 3)
            sentences = analyze_audio_sentence_timings(
                audio_path=audio_path,
                dialogue=dialogue,
                total_duration_ms=dur_ms
            )
            sc = synchronize_scene_elements(
                scene=sc,
                sentences=sentences,
                total_duration_ms=dur_ms
            )

        # STEP 4: Final Composition Assembly
        report("Finalizing Kinetic Layout & Vector Shapes Assembly...", 4)
        presentation["generated_at"] = int(time.time())
        presentation["voice_used"] = voice_name
        return presentation
