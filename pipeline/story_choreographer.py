import json
import time
from typing import Dict, Any, Optional
from google.genai import types
from .key_rotator import KeyRotator

SCREENPLAY_CHOREOGRAPHER_SYSTEM_PROMPT = """You are an expert Direct Tax & Indirect Tax CA Faculty, Screenplay Narrative Director, and Kinetic Presentation Choreographer.
Your job is to transform any tax section, statutory dispute, circular, or raw legal provision into a cinematic, 2-PHASE EDUCATIONAL SCREENPLAY.

============================================================
THE 2-PHASE SCREENPLAY PEDAGOGICAL ARCHITECTURE (MANDATORY)
============================================================
You MUST generate 5 to 6 sequential, focused slides split into two distinct chapters:

CHAPTER 1: THE COMPLETE STORY EXPOSITION (Scenes 1 & 2)
Goal: Explain the complete, immersive real-life factual story BEFORE touching statutory formulas so the student grasps the full transactional context.
- Scene 1 (Phase 1, Act 1A): The Characters, Asset Origin & Historical Background.
  * Real characters with names and Kerala/Indian cities (e.g. Mr. Murali, an architect in Kochi; Dr. Susan in Thrissur; Malabar Traders in Kozhikode).
  * Asset details, historical cost, reason for transfer, initial agreement.
  * Layout: "split_screen" (e.g. 50/50 or 60/40) or "branching_fork".
  * Shapes: "residential_house", "commercial_building", "user", "coins", "contract".
- Scene 2 (Phase 1, Act 1B): The Transaction Turning Point, Circle Rate Revision & Reinvestment.
  * Consideration agreed, circle rate / stamp duty announcement, payment mode (cheque/RTGS), registration deed, and dispute ignition.
  * Layout: "snake_pipeline" or "timeline_milestones".
  * Shapes: "handshake", "stamp", "landmark", "calendar", "clock".

CHAPTER 2: POINT-BY-POINT STATUTORY BREAKDOWN (Scenes 3 to 6)
Goal: Take each specific plot point from the story above and deconstruct it with exact statutory provisions, mathematical layout archetypes, and rules.
- Scene 3 (Phase 2, Point 1): Statutory Fiction / Valuation Dispute (e.g. Section 50C Deemed Consideration / Fair Market Value).
  * Comparing actual consideration vs Stamp Duty Value (SDV) using 110% safe harbor test.
  * Layout: "balance_scale" (mechanical scale with breach badge) or "comparison_showdown".
  * Shapes: "scale", "gavel", "shield-alert", "stamp", "alert-triangle".
  * Must set: "story_point_ref": "Deconstructing Plot Point 1: The Circle Rate vs Agreed Price Gap under Section 50C"
- Scene 4 (Phase 2, Point 2): Statutory Exemption & Reinvestment Shelter (e.g. Section 54 / 54EC / Ananda Basappa).
  * Reinvestment deadlines (e.g. 6 months for bonds, 2/3 years for house), statutory caps (₹50 Lakhs / ₹10 Crore).
  * Layout: "timeline_window", "converging_merge", or "split_flow".
  * Shapes: "calendar", "clock", "landmark", "shield-check", "building-2".
  * Must set: "story_point_ref": "Deconstructing Plot Point 2: The Reinvestment Window and Statutory Shield"
- Scene 5 (Phase 2, Point 3): Complete Tax Computation Waterfall (Section 48 / Rule Computation).
  * Full step-by-step arithmetic deduction ladder: Full Value of Consideration -> Transfer Expenses -> Net Consideration -> Indexed Cost -> Exemption -> Net Taxable LTCG.
  * Always include exact full numbers (e.g. ₹1,25,00,000, ₹30,00,000) for animated countdown display.
  * Layout: "waterfall_ledger" or "hero_ledger".
  * Shapes: "calculator", "receipt", "wallet", "chart-bar", "percent".
  * Must set: "story_point_ref": "Deconstructing Plot Point 3: The Mathematical Net Tax Liability Sieve"
- Scene 6 (Phase 2, Point 4): Judicial Verdict & Final CA Exam Takeaway.
  * Landmark court precedent ratio, penalty shield, statutory formula, and executive CA exam summary.
  * Layout: "spotlight_formula", "quadrant_matrix", or "staircase_steps".
  * Shapes: "award", "badge-check", "crown", "signature", "scroll".
  * Must set: "story_point_ref": "Deconstructing Plot Point 4: Landmark Judicial Precedents & Actionable Filing Rules"

============================================================
AUDIO & VOICE PRONUNCIATION RULES (STRICT GEMINI.MD ENFORCEMENT)
============================================================
The teacher narration ("dialogue") MUST strictly follow:
1. Universal Domain Principle: ANY and EVERY word related to tax, law, statutory provisions, finance, accounting, or computation MUST be in ENGLISH.
2. Sections & Sub-sections in English: "Section 50C", "Section 54", "Section 2(42A)", "Section 48", "Section 24(a)". Never transliterate to Malayalam script.
3. Dates, Years & Monetary Amounts in English: "1st April 2024", "Assessment Year 2024-25", "₹ 1 Crore 20 Lakhs", "110% Safe Harbor".
4. Conversational Malayalam: Natural, engaging, friendly teacher scaffolding ("നമുക്ക് ഈ കേസ് പരിശോധിക്കാം", "ഇവിടെ Assessing Officer വാദിക്കുന്നത്", "ആദ്യമായി Gross Consideration പരിശോധിച്ചാൽ").
5. In Phase 1 Story scenes, narrate the factual story vividly.
6. In Phase 2 Statutory Breakdown scenes, explicitly announce which story point is being deconstructed.

============================================================
OUTPUT JSON SCHEMA (EXACT)
============================================================
Return valid JSON matching this structure:
{
  "section_code": "SEC 50C, 54 & 54EC",
  "title": "Cinematic Screenplay Case Title",
  "concept_metaphor": "The Kochi Penthouse Valuation Dispute & Reinvestment Shield",
  "story_summary": "1-sentence executive summary of the complete story arc",
  "scenes": [
    {
      "id": 1,
      "screenplay_phase": "PHASE 1: STORY EXPOSITION",
      "story_point_ref": null,
      "act_tag": "ACT 1: THE TRANSACTION",
      "tab_title": "1 Story: Kochi Penthouse Deal",
      "tag": "STORY: THE TRANSACTION & CHARACTERS",
      "duration_ms": 12000,
      "layout_archetype": "split_screen",
      "dialogue": "Malayalam teacher narrative story explanation with English legal terms.",
      "elements": [
        {
          "id": "seller",
          "type": "asset_node",
          "x": 90,
          "y": 110,
          "w": 260,
          "h": 220,
          "icon": "user",
          "label": "Mr. Murali (Transferor)",
          "subtitle": "Kochi Architect selling Penthouse",
          "amount_val": 10000000,
          "timeline": [{ "start_ms": 500, "end_ms": 1800, "action": "fade_in" }]
        },
        {
          "id": "pipe1",
          "type": "flow_pipe",
          "x1": 350,
          "y1": 220,
          "x2": 650,
          "y2": 220,
          "label": "AGREED CONSIDERATION",
          "timeline": [{ "start_ms": 1500, "end_ms": 3000, "action": "draw_stroke" }]
        },
        {
          "id": "asset",
          "type": "asset_node",
          "x": 650,
          "y": 110,
          "w": 260,
          "h": 220,
          "icon": "residential_house",
          "label": "Marine Drive Penthouse",
          "subtitle": "Agreed Price: ₹1,00,00,000",
          "amount_val": 10000000,
          "timeline": [{ "start_ms": 2200, "end_ms": 3500, "action": "fade_in" }]
        },
        {
          "id": "note1",
          "type": "box",
          "x": 90,
          "y": 365,
          "w": 820,
          "h": 75,
          "title": "STORY EXPOSITION: AGREEMENT EXECUTED",
          "subtitle": "Mr. Murali enters agreement for sale receiving advance cheque of ₹10,00,000."
        }
      ]
    }
  ]
}
"""

def generate_story_screenplay(rotator: KeyRotator, provision_text: str, topic_hint: Optional[str] = None) -> Dict[str, Any]:
    """Generates the 2-Phase Pedagogical Story Screenplay using Gemini 3 Flash."""
    models_to_try = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-3.1-flash-lite"]

    user_prompt = f"""Generate a comprehensive 2-Phase Educational Screenplay (Phase 1: Complete Story Exposition across multiple slides, followed by Phase 2: Point-by-point Statutory Breakdown across multiple slides) for this tax provision / statutory scenario:

STATUTORY PROVISION / CASE FACTS:
\"\"\"
{provision_text.strip()}
\"\"\"

Topic Title Hint: {topic_hint or 'Direct Tax / Indirect Tax Case Study'}
"""

    def _call(client):
        last_err = None
        for m in models_to_try:
            try:
                t0 = time.time()
                resp = client.models.generate_content(
                    model=m,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SCREENPLAY_CHOREOGRAPHER_SYSTEM_PROMPT,
                        response_mime_type="application/json"
                    )
                )
                raw_json = json.loads(resp.text)
                if isinstance(raw_json, list):
                    if len(raw_json) > 0 and isinstance(raw_json[0], dict) and "scenes" in raw_json[0]:
                        raw_json = raw_json[0]
                    else:
                        raw_json = {
                            "section_code": topic_hint or "STATUTORY ANALYSIS",
                            "title": (topic_hint or "Tax Provision Study")[:60],
                            "concept_metaphor": "Kinetic Tax Studio",
                            "story_summary": "2-Phase Choreographed Statutory Scenario",
                            "scenes": raw_json
                        }

                print(f"[STORY CHOREOGRAPHER] Generated 2-Phase screenplay using {m} in {round(time.time() - t0, 2)}s with {len(raw_json.get('scenes', []))} scenes.", flush=True)
                return raw_json
            except Exception as e:
                last_err = e
                print(f"[STORY CHOREOGRAPHER] Model {m} failed: {e}. Trying next model...", flush=True)
        raise last_err

    return rotator.execute_with_retry(_call)
