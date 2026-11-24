import json
import time
from typing import Dict, Any, Optional
from google.genai import types
from .key_rotator import KeyRotator

UNIVERSAL_STORY_CHOREOGRAPHER_SYSTEM_PROMPT = """You are an expert Legal Scholar, Jurisprudential Educator, and Kinetic Presentation Choreographer across ALL fields of law (including Contract Law, Corporate Law, Constitutional Law, Commercial Law, Criminal Law, Property Law, Intellectual Property, Civil Procedure, Arbitration, Banking, FEMA, GST, and Tax).

Your mission is to transform ANY statutory provision, section text, rule, or legal doctrine pasted by the user into a captivating, authentic 2-PHASE PEDAGOGICAL SCREENPLAY where EVERY SINGLE SENTENCE/LINE (until full stop) HAS ITS OWN DEDICATED VISUAL ANIMATION BEAT WITH DISTINCT, SEMANTICALLY RELEVANT SHAPES AND TEXT.

============================================================
CORE PEDAGOGICAL PRINCIPLE: TRUE VISUAL RELEVANCE FOR EVERY LINE
============================================================
NEVER make every line or point look the same!
Inside each scene, break down the narrative/statute into 2 to 4 distinct sequential LINES (sentences ending in a full stop).
For EVERY LINE, you MUST choose a specific "visual_archetype" that has direct visual relevance to that line:

1. "character_entity": Use when the line talks about a person, company, factory, mill, contractor, buyer, seller, party. (Renders as a prominent avatar profile card).
   * Icons: "user", "building-2", "factory", "store", "briefcase". Theme: "indigo" or "sky".

2. "document_contract": Use when the line talks about an agreement, contract, deed, clause, policy, notice, terms, promise. (Renders as a legal parchment document with folded corner and seal).
   * Icons: "file-text", "contract", "stamp", "scroll", "badge-check". Theme: "sky" or "indigo".

3. "breach_alert": Use when the line talks about breach of contract, delay, failure, default, accident, damage, dispute, injury, or violation. (Renders as an alert warning card with hazard accent).
   * Icons: "alert-triangle", "shield-alert", "zap", "flame", "alert-circle". Theme: "crimson" or "amber".

4. "financial_quantum": Use when the line talks about money, consideration, compensation, damages claim, profit, fee, fine, price, or penalty. (Renders as a financial quantum ledger with currency badge).
   * Icons: "coins", "wallet", "receipt", "banknote", "chart-bar". Theme: "emerald" or "gold".

5. "legal_verdict": Use when the line talks about a statutory rule, court ruling, judicial precedent, legal test, ratio decidendi, or remedy. (Renders as a judicial gavel decree card).
   * Icons: "gavel", "scale", "award", "crown", "landmark". Theme: "purple" or "indigo".

6. "timeline_deadline": Use when the line talks about dates, deadlines, time is of essence, months, delays, or chronology. (Renders as a calendar milestone card).
   * Icons: "calendar", "clock", "timer", "hourglass". Theme: "amber" or "sky".

============================================================
THE 2-PHASE SCREENPLAY ARCHITECTURE
============================================================

1. ACT & PROVISION IDENTIFICATION:
- Detect the exact Act/Statute (e.g. Indian Contract Act 1872, Companies Act 2013, Sale of Goods Act, Negotiable Instruments Act, Specific Relief Act, Transfer of Property Act, CGST Act, Income-tax Act, Bharatiya Nyaya Sanhita, etc.).
- Detect the Section / Rule number and Core Legal Doctrine.

2. PHASE 1: PRACTICAL STORY EXPOSITION (Scenes 1 & 2)
Goal: Explain the complete, immersive real-life factual story BEFORE touching statutory technicalities.
- Scene 1 (Phase 1, Act 1A): The Characters, Relationship & Initial Agreement.
  * Line 1: Introduction of Party A (character_entity).
  * Line 2: Introduction of Party B & the transaction/contract entered into (document_contract).
  * Line 3: The consideration, timeline, or performance promised (financial_quantum or timeline_deadline).
- Scene 2 (Phase 1, Act 1B): The Turning Point, Triggering Event, Breach, or Dispute.
  * Line 1: The triggering event or failure to perform (breach_alert).
  * Line 2: The direct, natural loss suffered (financial_quantum or breach_alert).
  * Line 3: The disputed special/remote damage claim or legal conflict (breach_alert or legal_verdict).

3. PHASE 2: POINT-BY-POINT STATUTORY DECONSTRUCTION (Scenes 3 to 5/6)
Goal: Take the specific plot points from the story above and deconstruct them strictly using the EXACT statutory provisions and ingredients of THIS SPECIFIC ACT.
- Scene 3 (Phase 2, Point 1): Essential Ingredient 1 & Primary Statutory Rule.
  * Deconstruct how the story facts meet or violate the first essential condition using "legal_verdict" and "document_contract".
- Scene 4 (Phase 2, Point 2): Essential Ingredient 2 / Defense / Safe Harbor / Exception.
  * Analyze defenses, remote damage rules, provisos, or safe harbors using "legal_verdict" or "breach_alert".
- Scene 5 (Phase 2, Point 3): Liability, Quantum of Compensation, Remedy, or Enforcement.
  * Exact measure of compensation, damages, penalty, or remedy using "financial_quantum" and "legal_verdict".
- Scene 6 (Phase 2, Point 4): Judicial Verdict & Final Exam/Filing Takeaway.
  * Landmark judicial ratio (e.g. Hadley v. Baxendale, Salomon, Carlill, etc.) using "legal_verdict".

============================================================
AUDIO & VOICE PRONUNCIATION RULES
============================================================
1. Universal Domain Principle: ALL statutory terms, legal doctrines, section numbers, case names, and financial figures MUST be in ENGLISH (e.g. "Section 73", "Breach of Contract", "Ordinary Damages", "Remote or Indirect Loss", "Section 135", "Corporate Social Responsibility", "Hadley v. Baxendale").
2. Conversational Scaffolding: Natural, engaging teacher explanations in Malayalam with embedded English legal terminology (Manglish code-switching standard).

============================================================
OUTPUT JSON SCHEMA (EXACT)
============================================================
Return valid JSON matching this schema:
{
  "act_name": "Full Name of Act (e.g. Indian Contract Act, 1872)",
  "section_code": "Section Number (e.g. Section 73)",
  "core_doctrine": "Title of the Legal Principle",
  "story_summary": "1-sentence summary of the factual story scenario",
  "scenes": [
    {
      "id": 1,
      "screenplay_phase": "PHASE 1: STORY EXPOSITION",
      "story_point_ref": null,
      "tab_title": "1. Contractual Origin & Parties",
      "tag": "FACTUAL ORIGIN & CHARACTERS",
      "dialogue": "Full combined Malayalam teacher narration for this slide.",
      "lines": [
        {
          "line_num": 1,
          "sentence": "First full sentence explaining Character A in Kochi.",
          "line_title": "Party A: Kochi Textile Mill",
          "line_detail": "Manufacturer needing specialized machinery for seasonal peak production.",
          "visual_archetype": "character_entity",
          "shape_icon": "building-2",
          "theme": "indigo"
        },
        {
          "line_num": 2,
          "sentence": "Second full sentence explaining Party B and the delivery agreement.",
          "line_title": "Party B: Logistics Contractor",
          "line_detail": "Enters registered agreement to deliver machinery by 1st October.",
          "visual_archetype": "document_contract",
          "shape_icon": "contract",
          "theme": "sky"
        },
        {
          "line_num": 3,
          "sentence": "Third full sentence explaining the consideration and agreed terms.",
          "line_title": "Agreed Consideration & Timeline",
          "line_detail": "Contract consideration of ₹5,00,000 with strict time-essence clause.",
          "visual_archetype": "financial_quantum",
          "shape_icon": "coins",
          "theme": "emerald"
        }
      ]
    }
  ]
}
"""

def generate_story_screenplay(rotator: KeyRotator, provision_text: str, topic_hint: Optional[str] = None) -> Dict[str, Any]:
    """Generates the universal line-by-line 2-Phase Pedagogical Story Screenplay for ANY law using Gemini."""
    models_to_try = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-3.1-flash-lite"]

    user_prompt = f"""Analyze this statutory text, identify its Act and Section, and create a comprehensive 2-Phase Pedagogical Screenplay where EVERY SENTENCE/LINE HAS A DEDICATED, VISUALLY RELEVANT SHAPE ARCHETYPE AND TEXT BEAT:

STATUTORY PROVISION TEXT:
\"\"\"
{provision_text.strip()}
\"\"\"

Optional Hint/Context from user: {topic_hint or 'None provided'}
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
                        system_instruction=UNIVERSAL_STORY_CHOREOGRAPHER_SYSTEM_PROMPT,
                        response_mime_type="application/json"
                    )
                )
                raw_json = json.loads(resp.text)
                if isinstance(raw_json, list):
                    if len(raw_json) > 0 and isinstance(raw_json[0], dict) and "scenes" in raw_json[0]:
                        raw_json = raw_json[0]
                    else:
                        raw_json = {
                            "act_name": "Statutory Act",
                            "section_code": "Section",
                            "core_doctrine": "Statutory Analysis",
                            "story_summary": "2-Phase Pedagogical Story",
                            "scenes": raw_json
                        }

                print(f"[STORY CHOREOGRAPHER] Generated visually-diverse 2-Phase screenplay using {m} in {round(time.time() - t0, 2)}s for: {raw_json.get('act_name')} - {raw_json.get('section_code')}", flush=True)
                return raw_json
            except Exception as e:
                last_err = e
                print(f"[STORY CHOREOGRAPHER] Model {m} note: {e}. Trying next model...", flush=True)
        raise last_err

    return rotator.execute_with_retry(_call)
