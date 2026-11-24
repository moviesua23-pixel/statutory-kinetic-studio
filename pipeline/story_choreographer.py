import os
import json
import re
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

1. "money_transfer": Payment of consideration, advance, rent, statutory fees.
   - Schema: {"from_actor": string, "to_actor": string, "amount": string, "numeric_value": number, "description": string, "from_action": string, "settled_status": string}
   - Example: {"from_actor": "ABC Ltd (Payer)", "to_actor": "XYZ Corp (Payee)", "amount": "₹50,000", "numeric_value": 50000, "description": "Consideration Remittance", "from_action": "Remitting Consideration", "settled_status": "PAYMENT TRANSMITTED"}

2. "contract_sign": Executing agreement, deed, lease, contract, or written memo.
   - Schema: {"title": string, "parties": string, "key_term": string, "stamp_text": string, "document_header": string}
   - Example: {"title": "Commercial Supply Agreement", "parties": "Vendor Ltd & Buyer Corp", "key_term": "Prescribed Statutory Covenant", "stamp_text": "EXECUTED RECORD", "document_header": "OFFICIAL INSTRUMENT / RECORD"}

3. "handshake_consent": Offer & acceptance, free consent, consensus ad idem, bilateral pact.
   - Schema: {"party_a": string, "party_b": string, "consent_rule": string, "status": string, "party_a_role": string, "party_b_role": string}
   - Example: {"party_a": "Promisor", "party_b": "Promisee", "consent_rule": "Free Consent under Section 10", "status": "BILATERAL ACCORD CONCLUDED", "party_a_role": "Offeror", "party_b_role": "Acceptor"}

4. "goods_transport": Delivery of cargo, machinery, vehicles, inventory, or physical supply.
   - Schema: {"origin": string, "destination": string, "cargo": string, "delivery_status": string}
   - Example: {"origin": "Manufacturing Plant (Pune)", "destination": "Warehouse (Ernakulam)", "cargo": "Industrial Machinery", "delivery_status": "CONSIGNMENT IN TRANSIT: Industrial Machinery"}

5. "breach_block": Contractual default, delivery failure, hazard alert, broken covenant, dispute.
   - Schema: {"event_title": string, "cause": string, "consequence": string}
   - Example: {"event_title": "Default & Non-Delivery Notice", "cause": "Failure to Deliver Consignment on Stipulated Date", "consequence": "Statutory Damages Triggered under Section 73"}

6. "balance_scale": Balancing rights vs duties, ordinary vs remote losses, burden of proof, defenses.
   - Schema: {"left_weight": string, "left_amount": string, "right_weight": string, "right_amount": string, "verdict": string}
   - Example: {"left_weight": "Ordinary Direct Loss", "left_amount": "₹1,50,000", "right_weight": "Remote Consequential Loss", "right_amount": "₹10,00,000", "verdict": "STATUTORY BALANCE EVALUATED"}

7. "financial_meter": Business profits, damages quantum, loss computation, turnover thresholds.
   - Schema: {"title": string, "numeric_value": number, "max_value": number, "min_value": number, "threshold": number, "direction": "gain"|"loss"|"threshold", "unit": string, "status": string}
   - IMPORTANT: If sentence mentions an amount (e.g. "a quantified loss of ₹2,00,000"), you MUST set "numeric_value": 200000 and "direction": "loss".
   - Example: {"title": "Quantified Damages Assessment", "numeric_value": 200000, "max_value": 500000, "min_value": 0, "threshold": 100000, "direction": "loss", "unit": "₹", "status": "STATUTORY LOSS COMPUTATION"}

8. "gavel_verdict": Judicial verdicts, landmark court rulings, final arbitrator award, ratio decidendi.
   - Schema: {"court_name": string, "case_citation": string, "ratio": string, "badge": string}
   - Example: {"court_name": "SUPREME COURT OF INDIA", "case_citation": "Hadley v. Baxendale Precedent", "ratio": "Only natural and proximate damages naturally arising from breach are recoverable.", "badge": "JUDICIAL RATIO"}

9. "clock_limitation": Limitation periods, time is essence of contract, deadline expiry, statutory delays.
   - Schema: {"act_title": string, "deadline": string, "elapsed": number, "limit": number, "unit": string, "is_barred": boolean, "verdict": string}
   - Example: {"act_title": "Limitation Period", "deadline": "Within 3 Years", "elapsed": 2, "limit": 3, "unit": "Years", "is_barred": false, "verdict": "LIMITATION PERIOD COMPUTED"}

10. "property_transfer": Real estate conveyance, title transfer, land parcel handover, possession of premises.
    - Schema: {"transferor": string, "transferee": string, "property_desc": string, "deed_title": string, "status": string}
    - Example: {"transferor": "Vendor Entity", "transferee": "Purchaser Entity", "property_desc": "Commercial Property Asset", "deed_title": "Registered Conveyance Instrument", "status": "CONVEYANCE INSTRUMENT EXECUTED"}

11. "condition_checklist": Statutory essential ingredients, compliance criteria, multi-step tests.
    - Schema: {"title": string, "conditions": [{"text": string, "satisfied": boolean}], "verdict": string}
    - Example: {"title": "Essential Statutory Ingredients", "conditions": [{"text": "1. Competent Parties", "satisfied": true}, {"text": "2. Free Consent", "satisfied": true}, {"text": "3. Lawful Consideration", "satisfied": true}, {"text": "4. Lawful Object", "satisfied": true}], "verdict": "ALL 4 STATUTORY CONDITIONS EVALUATED"}

12. "lock_security": Security deposits, bank guarantee, confidentiality, fiduciary protection.
    - Schema: {"title": string, "amount": string, "numeric_value": number, "obligor": string, "beneficiary": string, "protection_scope": string, "status": string}
    - Example: {"title": "Bank Guarantee", "amount": "₹25,00,000", "numeric_value": 2500000, "obligor": "Contractor / Obligor", "beneficiary": "Beneficiary Authority", "protection_scope": "Statutory Performance Guarantee", "status": "SECURITY INSTRUMENT RECORDED"}

13. "corporate_board": Corporate resolutions, board meetings, shareholder votes, company decisions.
    - Schema: {"company_name": string, "resolution_title": string, "votes_for": number, "votes_against": number, "required_threshold": number, "status": string}
    - Example: {"company_name": "Governing Body", "resolution_title": "Special Resolution under Act", "votes_for": 85, "votes_against": 15, "required_threshold": 75, "status": "RESOLUTION VOTE CONCLUDED"}

14. "notice_dispatch": Serving legal notice, registered post with AD, demand letter, revocation telegram.
    - Schema: {"notice_title": string, "sender": string, "recipient": string, "dispatch_mode": string, "status": string}
    - Example: {"notice_title": "Formal Statutory Notice", "sender": "Issuing Authority", "recipient": "Taxpayer / Addressee", "dispatch_mode": "Registered Dispatch", "status": "FORMAL NOTICE DISPATCHED"}

15. "penalty_fine": Statutory fines, late fees, penalty notices, punitive damages, revenue demands.
    - Schema: {"penalty_title": string, "reason": string, "base_demand": string, "penalty_amount": string, "interest_amount": string, "total_amount": string, "numeric_value": number, "row1_label": string, "row2_label": string, "row3_label": string, "total_label": string, "status": string}
    - Example: {"penalty_title": "Statutory Demand Notice", "reason": "Willful Statutory Default", "base_demand": "₹50,00,000", "penalty_amount": "₹50,00,000", "interest_amount": "₹9,00,000", "total_amount": "₹1,09,00,000", "numeric_value": 10900000, "row1_label": "1. Primary Assessed Demand", "row2_label": "2. Prescribed Statutory Penalty", "row3_label": "3. Statutory Interest Component", "total_label": "TOTAL STATUTORY DEMAND", "status": "STATUTORY DEMAND ISSUED"}

16. "waterfall_flow": Sequential computation, statutory priority distribution ladder, priority tiers.
    - Schema: {"waterfall_title": string, "realized_corpus": string, "tiers": [{"label": string, "amount": string, "settled": boolean}], "status": string}
    - Example: {"waterfall_title": "Statutory Priority Distribution", "realized_corpus": "₹5,00,00,000", "tiers": [{"label": "Step 1: Priority Tier I", "amount": "₹50,00,000", "settled": true}, {"label": "Step 2: Priority Tier II", "amount": "₹2,50,00,000", "settled": true}, {"label": "Step 3: Priority Tier III", "amount": "₹1,00,00,000", "settled": true}, {"label": "Step 4: Priority Tier IV", "amount": "₹1,00,00,000", "settled": true}, {"label": "Step 5: Priority Tier V", "amount": "₹0", "settled": false}], "status": "PRIORITY DISTRIBUTION COMPLETE"}

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

def estimate_speech_duration_ms(sentence: str) -> int:
    """
    Requirement 1: Ensures nominal line duration strictly accounts for speech length,
    guaranteeing narration finishes within the PERFORM phase (0-65%) and leaves a >= 1.5s
    real-time hold in SETTLE (65-100%).
    Standard educational speech rate is ~360ms per word.
    """
    words = len(sentence.strip().split()) if sentence else 0
    speech_ms = words * 360
    # Settle hold is 35% of total line, so speech must finish within 65% of the line
    needed_for_perform_phase = int(speech_ms / 0.65) if speech_ms > 0 else 0
    return max(5400, needed_for_perform_phase, speech_ms + 1890)

def extract_monetary_amount_from_sentence(sentence: str) -> Optional[int]:
    """
    Extracts a monetary amount from a sentence when the model omitted numeric_value.
    Ignores percentages (e.g. '18%', '50%'), calendar years (e.g. '2024', '1872'),
    and statutory section/order numbers (e.g. 'Section 73', 'Rule 31', 'Section 16(2)').
    The model's value is authoritative; this is strictly a fallback gap filler.
    Supports:
      - Currency symbols with Lakhs / Crores: e.g. ₹2 Lakh, Rs. 1.5 Crore, ₹ 10 Cr, 2 Lakhs
      - Currency-prefixed numbers with commas or plain digits: e.g. ₹2,00,000, Rs. 50,000, ₹50000
      - Distinct numbers with commas that are not years/percentages: e.g. "a quantified loss of 2,00,000"
    """
    if not sentence:
        return None

    # 1. Currency symbol or standalone with Lakhs / Crores: e.g. ₹2 Lakh, Rs. 1.5 Crore, ₹ 10 Cr, 2 Lakhs
    lakh_crore_pattern = re.compile(
        r'(?:₹|Rs\.?|INR)?\s*(\d+(?:\.\d+)?)\s*(lakhs?|crores?|cr|lac|lacs)\b',
        re.IGNORECASE
    )
    m = lakh_crore_pattern.search(sentence)
    if m:
        num = float(m.group(1))
        unit = m.group(2).lower()
        if 'cr' in unit or 'crore' in unit:
            return int(num * 10000000)
        else:
            return int(num * 100000)

    # 2. Currency-prefixed numbers with commas or plain digits: e.g. ₹2,00,000, Rs. 50,000, ₹50000
    currency_pattern = re.compile(
        r'(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)',
        re.IGNORECASE
    )
    m = currency_pattern.search(sentence)
    if m:
        raw_num = m.group(1).replace(',', '')
        try:
            return int(float(raw_num))
        except ValueError:
            pass

    # 3. Comma-grouped numbers that are NOT percentages, years, or section numbers: e.g. "a quantified loss of 2,00,000"
    comma_pattern = re.compile(r'\b(\d{1,3}(?:,\d{2,3})+)\b')
    for cm in comma_pattern.finditer(sentence):
        end_pos = cm.end()
        # Verify not followed by %
        if end_pos < len(sentence) and sentence[end_pos:end_pos+1] == '%':
            continue
        start_pos = cm.start()
        # Verify not preceded by section/rule/order/article
        prefix = sentence[max(0, start_pos - 15):start_pos].lower()
        if any(w in prefix for w in ['section', 'rule', 'order', 'article', 'clause', 'sub-section']):
            continue
        num_str = cm.group(1).replace(',', '')
        try:
            val = int(num_str)
            # Avoid 4-digit years like 2024
            if 1800 <= val <= 2100:
                continue
            return val
        except ValueError:
            pass

    return None

def infer_direction_from_sentence(sentence: str) -> str:
    s = sentence.lower() if sentence else ""
    loss_keywords = ["loss", "penalty", "damage", "deficit", "fine", "reversed", "ineligible", "default", "breach", "demanded", "violation"]
    gain_keywords = ["profit", "gain", "surplus", "credit", "itc", "eligible", "allowed", "recovered", "settled", "earned"]
    threshold_keywords = ["threshold", "turnover", "ceiling", "limit", "prescribed"]

    for kw in loss_keywords:
        if kw in s:
            return "loss"
    for kw in gain_keywords:
        if kw in s:
            return "gain"
    for kw in threshold_keywords:
        if kw in s:
            return "threshold"
    return "threshold"

def validate_and_sanitize_screenplay(raw_json: Any, provision_text: str) -> Dict[str, Any]:
    """
    Validates and sanitizes the Gemini screenplay JSON.
    Injects resilient defaults for layout_payload and action_payload so that
    no invalid field or missing property causes frontend rendering failure.
    The model's value is authoritative. The regex only fills gaps, and every fallback activation is logged.
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
            # Unknown action_type: use a neutral fallback card, not contract_sign, and log a warning
            if act_type not in VALID_ACTIONS:
                print(f"[VALIDATOR FALLBACK] Unknown action_type '{act_type}'. Coercing to 'neutral_action'.", flush=True)
                act_type = "neutral_action"
            line["action_type"] = act_type
            line["line_num"] = l_idx + 1
            if not line.get("sentence"):
                line["sentence"] = f"Sentence {l_idx + 1} explaining {data['core_doctrine']}."
            sentence_text = line["sentence"]
            explicit_dur = int(line.get("duration_ms") or 0)
            speech_needed = estimate_speech_duration_ms(sentence_text)
            line["duration_ms"] = max(explicit_dur, speech_needed, 5400)
            if not line.get("line_title"):
                line["line_title"] = f"Step {l_idx + 1}: {act_type.replace('_', ' ').title()}"

            ap = line.get("action_payload")
            if not isinstance(ap, dict):
                ap = {}

            # The model's value is authoritative. The regex only fills gaps, and every fallback activation is logged.
            if act_type in ("financial_meter", "penalty_fine", "money_transfer", "lock_security"):
                has_model_num = (
                    ap.get("numeric_value") is not None and
                    not isinstance(ap.get("numeric_value"), bool) and
                    str(ap.get("numeric_value")).strip() != ""
                )
                if not has_model_num:
                    extracted = extract_monetary_amount_from_sentence(sentence_text)
                    if extracted is not None:
                        ap["numeric_value"] = extracted
                        safe_sentence = sentence_text.encode('ascii', errors='replace').decode('ascii')
                        print(f"[VALIDATOR FALLBACK] Extracted numeric_value={extracted} from sentence: '{safe_sentence}'", flush=True)
                        if act_type == "financial_meter":
                            if ap.get("max_value") is None:
                                ap["max_value"] = max(int(extracted * 1.5), 1000000)
                            if not ap.get("direction"):
                                ap["direction"] = infer_direction_from_sentence(sentence_text)
                        elif act_type == "penalty_fine":
                            if not ap.get("penalty_amount") and not ap.get("total_amount"):
                                ap["total_amount"] = f"₹{extracted:,}"
                        elif act_type == "money_transfer":
                            if not ap.get("amount"):
                                ap["amount"] = f"₹{extracted:,}"
                        elif act_type == "lock_security":
                            if not ap.get("amount"):
                                ap["amount"] = f"₹{extracted:,}"
            elif act_type == "clock_limitation":
                if ap.get("limit") is None or ap.get("elapsed") is None:
                    lim_match = re.search(r'(?:within|period of|limit of)\s*(\d+)\s*(years?|months?|days?)', sentence_text, re.IGNORECASE)
                    if lim_match:
                        extracted_lim = int(lim_match.group(1))
                        ap.setdefault("limit", extracted_lim)
                        ap.setdefault("elapsed", max(1, extracted_lim - 1))
                        ap.setdefault("unit", lim_match.group(2).title())
                        safe_sentence = sentence_text.encode('ascii', errors='replace').decode('ascii')
                        print(f"[VALIDATOR FALLBACK] Extracted clock limit={extracted_lim} from sentence: '{safe_sentence}'", flush=True)

            line["action_payload"] = ap
            sanitized_lines.append(line)

        sc["lines"] = sanitized_lines
        sanitized_scenes.append(sc)

    data["scenes"] = sanitized_scenes
    return data

def generate_story_screenplay(
    rotator: KeyRotator,
    provision_text: str,
    topic_hint: Optional[str] = None,
    raw_json_save_path: Optional[str] = None
) -> Dict[str, Any]:
    """Generates the universal action-driven 2-Phase Pedagogical Story Screenplay for ANY law using Gemini."""
    models_to_try = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.0-flash", "gemini-2.5-pro"]

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
                if raw_json_save_path:
                    os.makedirs(os.path.dirname(os.path.abspath(raw_json_save_path)), exist_ok=True)
                    with open(raw_json_save_path, "w", encoding="utf-8") as f:
                        json.dump(raw_json, f, indent=2, ensure_ascii=False)
                    print(f"[STORY CHOREOGRAPHER] Saved raw Gemini JSON to: {raw_json_save_path}", flush=True)

                validated = validate_and_sanitize_screenplay(raw_json, provision_text)
                print(f"[STORY CHOREOGRAPHER] Generated & Validated 2-Phase screenplay using {m} in {round(time.time() - t0, 2)}s for: {validated.get('act_name')} - {validated.get('section_code')}", flush=True)
                return validated
            except Exception as e:
                last_err = e
                print(f"[STORY CHOREOGRAPHER] Model {m} note: {e}. Trying next model...", flush=True)
        raise last_err

    return rotator.execute_with_retry(_call)

