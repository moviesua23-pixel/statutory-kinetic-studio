import os
import re
from typing import List, Dict, Any, Optional
from pydub import AudioSegment, silence

ABBREVIATIONS = ['mr', 'mrs', 'ms', 'dr', 'prof', 'ltd', 'pvt', 'ay', 'fy', 'py', 'sec', 'co', 'cit', 'sc', 'hc', 'i.e', 'e.g', 'vs', 'v']

def split_sentences_smart(text: str) -> List[str]:
    """Splits narration text into sentences while protecting abbreviations, initials, and decimals."""
    if not text:
        return []
    protected = text
    for abbr in ABBREVIATIONS:
        protected = re.sub(rf'\b({abbr})\.', r'\1<DOT>', protected, flags=re.IGNORECASE)
    protected = re.sub(r'\b([A-Z])\.', r'\1<DOT>', protected)
    protected = re.sub(r'(\d+)\.(\d+)', r'\1<DOT>\2', protected)
    
    parts = re.split(r'([.?!।\n]+)', protected)
    sentences = []
    for i in range(0, len(parts)-1, 2):
        s = (parts[i] + parts[i+1]).replace('<DOT>', '.').strip()
        if s:
            sentences.append(s)
    if len(parts) % 2 == 1 and parts[-1].strip():
        s = parts[-1].replace('<DOT>', '.').strip()
        if s:
            sentences.append(s)
    return sentences if sentences else [text.strip()]

def analyze_audio_sentence_timings(audio_path: str, dialogue: str, total_duration_ms: int) -> List[Dict[str, Any]]:
    """
    Acoustically analyzes the audio track to detect phrase boundaries, silences,
    and voice energy envelopes, returning precise sentence-level millisecond timestamps.
    """
    sentences = split_sentences_smart(dialogue)
    if not sentences:
        return [{"text": dialogue, "start_ms": 200, "end_ms": max(2000, total_duration_ms)}]

    # Acoustic silence/energy boundary detection via pydub
    voiced_chunks = []
    if audio_path and os.path.exists(audio_path):
        try:
            seg = AudioSegment.from_file(audio_path)
            # Detect non-silent chunks with min silence of 280ms
            nonsilent = silence.detect_nonsilent(seg, min_silence_len=280, silence_thresh=seg.dBFS - 14)
            if nonsilent and len(nonsilent) >= len(sentences):
                voiced_chunks = nonsilent
        except Exception as e:
            print(f"  [TIMING ALIGNER] Acoustic waveform note: {e}", flush=True)

    result_sentences = []
    total_chars = sum(len(s) for s in sentences)
    
    # If acoustic chunks match sentences well, snap to acoustic voice onset
    if voiced_chunks and len(voiced_chunks) >= len(sentences):
        for idx, s in enumerate(sentences):
            chunk = voiced_chunks[idx]
            start_ms = max(100, chunk[0] - 80)
            end_ms = min(total_duration_ms, chunk[1] + 120)
            result_sentences.append({
                "text": s,
                "start_ms": start_ms,
                "end_ms": end_ms
            })
    else:
        # Monotonic character-share proportional distribution with lead-in padding
        cur_ms = 200
        usable_duration = max(1000, total_duration_ms - 400)
        for idx, s in enumerate(sentences):
            share = len(s) / max(1, total_chars)
            dur = max(1200, int(share * usable_duration))
            end_ms = min(total_duration_ms, cur_ms + dur)
            result_sentences.append({
                "text": s,
                "start_ms": cur_ms,
                "end_ms": end_ms
            })
            cur_ms = end_ms

    return result_sentences

def synchronize_scene_elements(scene: Dict[str, Any], sentences: List[Dict[str, Any]], total_duration_ms: int) -> Dict[str, Any]:
    """
    Synchronizes layout shapes, arithmetic ladder steps, and animation entrance triggers
    with the exact sentence timestamps analyzed from the voice track.
    """
    elements = scene.get("elements", [])
    if not elements or not sentences:
        return scene

    num_elements = len(elements)
    num_sentences = len(sentences)

    for idx, el in enumerate(elements):
        # Map element to corresponding sentence trigger
        sent_idx = min(idx, num_sentences - 1)
        trigger_sent = sentences[sent_idx]

        trigger_start = max(150, trigger_sent["start_ms"] - 120)
        trigger_end = min(total_duration_ms, trigger_sent["end_ms"])

        # Update root start/end
        el["start_ms"] = trigger_start
        el["end_ms"] = trigger_end

        # Update element internal timeline
        if "timeline" not in el or not el["timeline"]:
            el["timeline"] = [
                {
                    "start_ms": trigger_start,
                    "end_ms": trigger_start + 600,
                    "action": "fade_in" if el.get("type") != "flow_pipe" else "draw_stroke"
                }
            ]
        else:
            for item in el["timeline"]:
                item["start_ms"] = max(100, trigger_start)
                item["end_ms"] = min(total_duration_ms, trigger_start + 800)

        # Ladder and countdown values: mark countdown trigger
        if "amount_val" in el or "val" in el:
            el["countdown_trigger_ms"] = trigger_start + 200

    scene["sentences"] = sentences
    scene["duration_ms"] = total_duration_ms
    return scene
