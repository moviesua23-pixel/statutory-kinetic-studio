import os
import hashlib
import time
from typing import Tuple, Dict, Any
from pydub import AudioSegment
from gtts import gTTS
from google.genai import types
from .key_rotator import KeyRotator

def synthesize_scene_audio(
    rotator: KeyRotator,
    dialogue: str,
    output_dir: str,
    scene_idx: int,
    voice_name: str = "Aoede"
) -> Tuple[str, str, int]:
    """
    Synthesizes expressive bilingual audio for a scene.
    Returns: (audio_filepath, audio_web_url, duration_ms)
    """
    os.makedirs(output_dir, exist_ok=True)
    clean_dialogue = dialogue.strip()
    if not clean_dialogue:
        return "", "", 0

    h = hashlib.md5(f"{clean_dialogue}_{voice_name}".encode("utf-8")).hexdigest()[:10]
    filename = f"audio_scene_{scene_idx+1}_{h}.mp3"
    filepath = os.path.join(output_dir, filename)
    web_url = f"/static/audio/{filename}"

    # Return cached audio if already generated
    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        try:
            seg = AudioSegment.from_file(filepath)
            dur_ms = len(seg)
            print(f"[VOICE SYNTHESIZER] Cache hit: {filename} ({dur_ms}ms)", flush=True)
            return filepath, web_url, dur_ms
        except Exception:
            pass

    # 1. Primary: Gemini 3.1 Neural TTS (gemini-3.1-flash-tts-preview)
    try:
        config = types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            )
        )
        def _call_tts(client):
            return client.models.generate_content(
                model="gemini-3.1-flash-tts-preview",
                contents=[clean_dialogue],
                config=config
            )

        resp = rotator.execute_with_retry(_call_tts)
        pcm_data = resp.candidates[0].content.parts[0].inline_data.data
        seg = AudioSegment(
            data=pcm_data,
            sample_width=2,
            frame_rate=24000,
            channels=1
        )
        seg.export(filepath, format="mp3", bitrate="192k")
        dur_ms = len(seg)
        print(f"[VOICE SYNTHESIZER] Gemini Voice '{voice_name}' generated: {filename} ({dur_ms}ms, {os.path.getsize(filepath)} bytes)", flush=True)
        return filepath, web_url, dur_ms

    except Exception as gemini_err:
        print(f"[VOICE SYNTHESIZER] Gemini TTS note: {gemini_err}. Attempting gTTS fallback...", flush=True)

    # 2. Resilient Fallback: gTTS
    try:
        tts = gTTS(text=clean_dialogue, lang="ml", slow=False)
        tts.save(filepath)
        seg = AudioSegment.from_file(filepath)
        dur_ms = len(seg)
        print(f"[VOICE SYNTHESIZER] gTTS fallback generated: {filename} ({dur_ms}ms)", flush=True)
        return filepath, web_url, dur_ms
    except Exception as gtts_err:
        print(f"[VOICE SYNTHESIZER] Error generating speech: {gtts_err}", flush=True)
        # Fallback duration estimate
        est_dur = max(8000, len(clean_dialogue.split()) * 520)
        return "", "", est_dur
