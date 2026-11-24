import json
import time
from typing import Dict, Any, Optional, List
from google.genai import types
from .key_rotator import KeyRotator

UNIVERSAL_STORY_CHOREOGRAPHER_SYSTEM_PROMPT = """You are an expert Legal Scholar, Jurisprudential Educator, and Kinetic Animation Director across ALL fields of law (including Contract Law, Corporate Law, Constitutional Law, Commercial Law, Criminal Law, Property Law, Intellectual Property, Civil Procedure, Arbitration, Banking, FEMA, GST, and Tax).

Your mission is to transform ANY statutory provision, section text, rule, or legal doctrine pasted by the user into a captivating, authentic 2-PHASE ACTION-DRIVEN KINETIC SCREENPLAY.

============================================================
CORE PRINCIPLE: ACTION-DRIVEN KINETIC ANIMATION (NO STATIC BOXES!)
============================================================
The animation must visually ACT OUT what the line literally describes on the screen.
DO NOT use static flashcards or identical boxes.
For each scene, break down the narrative into 2 to 4 distinct sequential LINES (sentences ending in a full stop).
For EVERY SINGLE LINE, you MUST detect the primary action verb and choose the matching "action_type" and populate its "action_payload":

SUPPORTED KINETIC ACTION TYPES (16 SPECIALIZED ENGINES):

1. "money_transfer": Payment of consideration, rent, fees, price, advance deposits.
   - action_payload: {"from_actor": "Payer Name", "from_icon": "user", "to_actor": "Receiver Name", "to_icon": "store", "amount": "₹50,000", "description": "Consideration description"}

2. "contract_sign": Executing agreement, deed, lease, contract, or written memo.
   - action_payload: {"title": "Deed Title", "parties": "Party A & Party B", "key_term": "Core contractual term", "stamp_text": "SIGNED & REGISTERED"}

3. "handshake_consent": Offer & acceptance, free consent, consensus ad idem, bilateral pact.
   - action_payload: {"party_a": "Promisor", "party_b": "Promisee", "consent_rule": "Free Consent (Section 10)", "status": "Valid Mutual Consent"}

4. "goods_transport": Delivery of cargo, machinery, vehicles, inventory, or physical supply.
   - action_payload: {"origin": "Origin Depot", "destination": "Destination Port", "cargo": "Machinery / Goods", "status": "In Transit"}

5. "breach_block": Contractual default, delivery failure, hazard alert, broken covenant, dispute.
   - action_payload: {"event_title": "Breach of Contract", "cause": "Default reason", "consequence": "Direct business impact"}

6. "balance_scale": Balancing rights vs duties, ordinary vs remote losses, burden of proof, defenses.
   - action_payload: {"left_weight": "Claim A / Ordinary Loss", "left_amount": "₹1,50,000", "right_weight": "Claim B / Remote Loss", "right_amount": "₹10,00,000", "verdict": "Scale Tilts: Only Natural Loss Allowed"}

7. "financial_meter": Business profits, losses, damages quantification, revenue impact.
   - action_payload: {"metric_name": "Net Profit / Loss Impact", "direction": "down" or "up", "value": "(-) ₹3,00,000", "detail": "Quantified damage figure"}

8. "gavel_verdict": Judicial verdicts, landmark court rulings, final arbitrator award, ratio decidendi.
   - action_payload: {"court_name": "Landmark Ratio", "case_citation": "Case Law Citation", "ratio": "Legal principle established"}

9. "clock_limitation": Limitation periods, time is essence of contract, deadline expiry, statutory delays.
   - action_payload: {"deadline_title": "Limitation Period / Time of Essence", "time_limit": "3 Years from Breach", "status": "Within Statutory Period / Barred by Limitation"}

10. "property_transfer": Real estate conveyance, title transfer, land parcel handover, possession of premises.
    - action_payload: {"property_name": "Commercial Building / Land Parcel", "transferor": "Owner Name", "transferee": "Purchaser Name", "title_status": "Absolute Title Conveyed"}

11. "condition_checklist": Statutory essential ingredients, compliance criteria, 3-step or 4-step tests.
    - action_payload: {"criteria": ["1. Competent Parties", "2. Free Consent", "3. Lawful Consideration", "4. Lawful Object"], "active_step": 2, "compliance_status": "All Conditions Fulfilled"}

12. "lock_security": Security deposits, confidentiality, fraud protection, fiduciary protection, bank guarantee.
    - action_payload: {"security_type": "Bank Guarantee / Non-Disclosure", "status": "Secured / Lock Engaged", "protection_scope": "Protects against unauthorized breach"}

13. "corporate_board": Corporate resolutions, board meetings, shareholder votes, company decisions.
    - action_payload: {"company_name": "Corporate Entity", "resolution": "Ordinary / Special Resolution Passed", "voting_result": "85% Assent vs 15% Dissent"}

14. "notice_dispatch": Serving legal notice, registered post with AD, demand letter, revocation telegram.
    - action_payload: {"notice_type": "Notice of Termination / Revocation", "sender": "Party A", "recipient": "Party B", "delivery_status": "Speed Post Delivered with AD"}

15. "penalty_fine": Statutory fines, late fees, penalty notices, punitive damages, revenue demands.
    - action_payload: {"penalty_title": "Statutory Penalty Under Section", "amount": "₹1,00,000", "reason": "Late Filing / Willful Default"}

16. "waterfall_flow": Sequential computation, statutory deductions, tax computation, damage calculation ladder.
    - action_payload: {"steps": [{"label": "Agreed Contract Price", "amount": "₹10,00,000"}, {"label": "Minus: Market Price on Breach", "amount": "₹8,50,000"}, {"label": "Net Recoverable Damage", "amount": "₹1,50,000"}]}

============================================================
SUPPORTED SLIDE LAYOUT ARCHETYPES & REQUIRED LAYOUT PAYLOADS:
============================================================
Every scene MUST specify a "layout_archetype" AND a matching "layout_payload" tailored to the statute:

1. "layout_bilateral_split":
   - Required layout_payload: {
       "left_label": "First Party Name & Role (e.g. Promisor, Assessee, Tenant, Plaintiff)",
       "left_role": "Legal Role or Capacity",
       "right_label": "Second Party Name & Role (e.g. Promisee, Assessing Officer, Landlord, Defendant)",
       "right_role": "Legal Role or Capacity"
     }

2. "layout_sequential_pipeline":
   - Required layout_payload: {
       "stages": [
         {"label": "1. Transaction Stage", "detail": "Sub-element explanation"},
         {"label": "2. Statutory Trigger", "detail": "Factual trigger"},
         {"label": "3. Adjudication", "detail": "Consequence or assessment"}
       ]
     }

3. "layout_quadrant_grid":
   - Required layout_payload: {
       "quadrants": [
         {"title": "Ingredient I", "body": "Statutory test or ingredient", "accent": "indigo"},
         {"title": "Ingredient II", "body": "Second essential ingredient", "accent": "emerald"},
         {"title": "Ingredient III", "body": "Third ingredient or defense", "accent": "amber"},
         {"title": "Ingredient IV", "body": "Fourth condition or outcome", "accent": "crimson"}
       ]
     }

4. "layout_precedent_parchment":
   - Required layout_payload: {
       "court": "SUPREME COURT OF INDIA / HIGH COURT",
       "case_name": "Full Landmark Case Citation",
       "year": "Year of Judgment (e.g. 2024)",
       "ratio_headline": "Core Ratio Decidendi & Binding Legal Rule"
     }

5. "layout_hero_stage":
   - Required layout_payload: {
       "hero_headline": "Focal Statutory Doctrine or Transaction",
       "focal_element": "Key focal concept"
     }

============================================================
THE 2-PHASE SCREENPLAY PEDAGOGICAL FLOW
============================================================

PHASE 1: STORY EXPOSITION (Scenes 1 & 2)
Vivid real-life characters and transactions demonstrating the provision.
- Scene 1: Meeting & Agreement (uses "layout_bilateral_split" or "layout_hero_stage"; actions: "handshake_consent", "contract_sign", or "money_transfer").
- Scene 2: The Turning Point / Event / Breach (uses "layout_sequential_pipeline" or "layout_hero_stage"; actions: "goods_transport", "breach_block", or "financial_meter").

PHASE 2: STATUTORY BREAKDOWN (Scenes 3 to 5/6)
Point-by-point legal deconstruction of the provision's exact words.
- Scene 3: Primary Rule / Essential Ingredients (uses "layout_quadrant_grid" or "layout_bilateral_split"; actions: "condition_checklist" or "balance_scale").
- Scene 4: Exceptions / Defenses / Limitation (uses "layout_hero_stage"; actions: "clock_limitation", "breach_block", or "lock_security").
- Scene 5: Remedies / Quantum / Waterfall Calculation (uses "layout_hero_stage" or "layout_sequential_pipeline"; actions: "waterfall_flow" or "financial_meter").
- Scene 6: Landmark Precedent & Takeaways (uses "layout_precedent_parchment"; actions: "gavel_verdict").

============================================================
AUDIO & VOICE PRONUNCIATION RULES
============================================================
1. Universal Domain Principle: ALL statutory terms, legal doctrines, section numbers, case names, and financial figures MUST be in ENGLISH (e.g. "Section 10", "Free Consent", "Lawful Consideration", "Section 73", "Hadley v. Baxendale").
2. Conversational Scaffolding: Natural, engaging teacher explanations in Malayalam with embedded English legal terminology (Manglish code-switching standard).

============================================================
OUTPUT JSON SCHEMA (EXACT)
============================================================
Return valid JSON matching this schema:
{
  "act_name": "Full Name of Act (e.g. Indian Contract Act, 1872)",
  "section_code": "Section Number (e.g. Section 10)",
  "core_doctrine": "Title of the Legal Principle",
  "story_summary": "1-sentence summary of the factual story scenario",
  "scenes": [
    {
      "id": 1,
      "screenplay_phase": "PHASE 1: STORY EXPOSITION",
      "layout_archetype": "layout_bilateral_split",
      "layout_payload": {
        "left_label": "Mr. Murali (Tenant)",
        "left_role": "Commercial Shop Lessee",
        "right_label": "Dr. Susan (Landlord)",
        "right_role": "Property Owner"
      },
      "story_point_ref": null,
      "tab_title": "1. Contractual Proposal & Agreement",
      "tag": "FACTUAL ORIGIN & CHARACTERS",
      "dialogue": "Full combined Malayalam teacher narration for this slide.",
      "lines": [
        {
          "line_num": 1,
          "sentence": "First full sentence of teacher explanation.",
          "line_title": "Mutual Proposal & Free Consent",
          "duration_ms": 4500,
          "action_type": "handshake_consent",
          "action_payload": {
            "party_a": "Mr. Murali (Tenant)",
            "party_b": "Dr. Susan (Landlord)",
            "consent_rule": "Free Consent (Section 10)",
            "status": "No Coercion, Fraud or Mistake"
          }
        }
      ]
    }
  ]
}
"""

VALID_LAYOUTS = [
    "layout_bilateral_split",
    "layout_sequential_pipeline",
    "layout_quadrant_grid",
    "layout_precedent_parchment",
    "layout_hero_stage"
]

VALID_ACTIONS = [
    "money_transfer", "contract_sign", "handshake_consent", "goods_transport",
    "breach_block", "balance_scale", "financial_meter", "gavel_verdict",
    "clock_limitation", "property_transfer", "condition_checklist",
    "lock_security", "corporate_board", "notice_dispatch", "penalty_fine",
    "waterfall_flow"
]

def validate_and_sanitize_screenplay(raw_json: Any, provision_text: str) -> Dict[str, Any]:
    """
    Validates and sanitizes the Gemini screenplay JSON.
    Injects resilient defaults for layout_payload and action_payload so that
    no invalid field or missing property causes frontend rendering failure.
    """
    if isinstance(raw_json, list):
        if len(raw_json) > 0 and isinstance(raw_json[0], dict) and "scenes" in raw_json[0]:
            data = raw_json[0]
        else:
            data = {"scenes": raw_json}
    elif isinstance(raw_json, dict):
        data = raw_json
    else:
        data = {}

    # Top-Level Sanity
    data["act_name"] = str(data.get("act_name") or "Statutory Law").strip()
    data["section_code"] = str(data.get("section_code") or "Statutory Provision").strip()
    data["core_doctrine"] = str(data.get("core_doctrine") or "Legal Analysis & Kinetic Breakdown").strip()
    data["story_summary"] = str(data.get("story_summary") or "Factual and statutory deconstruction").strip()

    raw_scenes = data.get("scenes") or []
    if not isinstance(raw_scenes, list) or len(raw_scenes) == 0:
        raw_scenes = [{
            "id": 1,
            "screenplay_phase": "PHASE 1: STORY EXPOSITION",
            "layout_archetype": "layout_hero_stage",
            "tab_title": "1. Statutory Overview",
            "dialogue": "Let us examine this statutory provision in detail.",
            "lines": [
                {
                    "line_num": 1,
                    "sentence": "Let us examine this statutory provision in detail.",
                    "line_title": "Statutory Exposition",
                    "duration_ms": 5400,
                    "action_type": "contract_sign",
                    "action_payload": {
                        "title": data["section_code"],
                        "parties": "Statutory Authority & Citizen",
                        "key_term": data["core_doctrine"],
                        "stamp_text": "ENACTED LAW"
                    }
                }
            ]
        }]

    sanitized_scenes = []
    for sc_idx, sc in enumerate(raw_scenes):
        if not isinstance(sc, dict):
            continue

        arch = sc.get("layout_archetype")
        if arch not in VALID_LAYOUTS:
            arch = "layout_hero_stage"
        sc["layout_archetype"] = arch
        sc["id"] = sc.get("id") or (sc_idx + 1)
        sc["tab_title"] = sc.get("tab_title") or f"{sc_idx + 1}. {sc.get('tag') or 'Scene Analysis'}"

        # Ensure layout_payload is properly structured
        lp = sc.get("layout_payload")
        if not isinstance(lp, dict):
            lp = {}

        if arch == "layout_bilateral_split":
            lp.setdefault("left_label", "First Party (Assessee / Promisor)")
            lp.setdefault("left_role", "Transferor / Claimant")
            lp.setdefault("right_label", "Second Party (Department / Promisee)")
            lp.setdefault("right_role", "Adjudicator / Counterparty")
        elif arch == "layout_sequential_pipeline":
            if "stages" not in lp or not isinstance(lp["stages"], list) or len(lp["stages"]) < 2:
                lp["stages"] = [
                    {"label": "1. Inception", "detail": "Statutory Transaction Executed"},
                    {"label": "2. Trigger Point", "detail": "Statutory Condition Evaluated"},
                    {"label": "3. Legal Outcome", "detail": "Consequence or Assessment"}
                ]
        elif arch == "layout_quadrant_grid":
            if "quadrants" not in lp or not isinstance(lp["quadrants"], list) or len(lp["quadrants"]) < 4:
                lp["quadrants"] = [
                    {"title": "Ingredient I", "body": "Essential statutory condition", "accent": "indigo"},
                    {"title": "Ingredient II", "body": "Mandatory compliance criteria", "accent": "emerald"},
                    {"title": "Ingredient III", "body": "Statutory limit or defense", "accent": "amber"},
                    {"title": "Ingredient IV", "body": "Consequence of breach or assessment", "accent": "crimson"}
                ]
        elif arch == "layout_precedent_parchment":
            lp.setdefault("court", "SUPREME COURT OF INDIA")
            lp.setdefault("case_name", f"{data['act_name']} Precedent")
            lp.setdefault("year", "2024")
            lp.setdefault("ratio_headline", data["core_doctrine"])
        elif arch == "layout_hero_stage":
            lp.setdefault("hero_headline", data["core_doctrine"])
            lp.setdefault("focal_element", data["section_code"])

        sc["layout_payload"] = lp

        # Sanitize Lines
        raw_lines = sc.get("lines") or []
        if not isinstance(raw_lines, list) or len(raw_lines) == 0:
            fallback_text = sc.get("dialogue") or "Statutory breakdown explanation."
            raw_lines = [{
                "line_num": 1,
                "sentence": fallback_text,
                "line_title": "Core Doctrine",
                "duration_ms": 5400,
                "action_type": "contract_sign",
                "action_payload": {
                    "title": data["section_code"],
                    "parties": "Parties to transaction",
                    "key_term": data["core_doctrine"],
                    "stamp_text": "VALID & BINDING"
                }
            }]

        sanitized_lines = []
        for l_idx, line in enumerate(raw_lines):
            if not isinstance(line, dict):
                continue
            act_type = line.get("action_type")
            if act_type not in VALID_ACTIONS:
                act_type = "contract_sign"
            line["action_type"] = act_type
            line["line_num"] = l_idx + 1
            line["duration_ms"] = max(int(line.get("duration_ms") or 5400), 5400)
            if not line.get("sentence"):
                line["sentence"] = f"Sentence {l_idx + 1} explaining {data['core_doctrine']}."
            if not line.get("line_title"):
                line["line_title"] = f"Step {l_idx + 1}: {act_type.replace('_', ' ').title()}"

            ap = line.get("action_payload")
            if not isinstance(ap, dict):
                ap = {}
            line["action_payload"] = ap
            sanitized_lines.append(line)

        sc["lines"] = sanitized_lines
        sanitized_scenes.append(sc)

    data["scenes"] = sanitized_scenes
    return data

def generate_story_screenplay(rotator: KeyRotator, provision_text: str, topic_hint: Optional[str] = None) -> Dict[str, Any]:
    """Generates the universal action-driven 2-Phase Pedagogical Story Screenplay for ANY law using Gemini."""
    models_to_try = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview", "gemini-3.1-flash-lite"]

    user_prompt = f"""Analyze this statutory text, identify its Act and Section, and create a comprehensive 2-Phase Pedagogical Screenplay with DATA-DRIVEN LAYOUTS where EVERY SENTENCE HAS A SPECIFIC KINETIC ACTION ANIMATION TYPE:

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
                validated = validate_and_sanitize_screenplay(raw_json, provision_text)
                print(f"[STORY CHOREOGRAPHER] Generated & Validated 2-Phase screenplay using {m} in {round(time.time() - t0, 2)}s for: {validated.get('act_name')} - {validated.get('section_code')}", flush=True)
                return validated
            except Exception as e:
                last_err = e
                print(f"[STORY CHOREOGRAPHER] Model {m} note: {e}. Trying next model...", flush=True)
        raise last_err

    return rotator.execute_with_retry(_call)
