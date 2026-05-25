from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from typing import Any

from ai.llm_client import LLMClient, LLMClientError


class CopilotServiceError(Exception):
    """Raised when copilot reasoning or parsing fails."""


COMMAND_SCHEMA = {
    "type": "object",
    "properties": {
        "intent": {"type": "string"},
        "target": {"type": "string"},
        "tool": {"type": "string"},
        "pathway": {"type": "string"},
        "route": {"type": "string"},
        "patient_id": {"type": "string"},
        "patient_name": {"type": "string"},
        "vitals": {
            "type": "object",
            "additionalProperties": {"type": "string"},
        },
        "actions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "intent": {"type": "string"},
                    "target": {"type": "string"},
                    "tool": {"type": "string"},
                    "pathway": {"type": "string"},
                    "route": {"type": "string"},
                    "patient_id": {"type": "string"},
                    "patient_name": {"type": "string"},
                    "vitals": {
                        "type": "object",
                        "additionalProperties": {"type": "string"},
                    },
                },
                "required": ["intent"],
            },
        },
        "response_text": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": ["intent", "response_text", "confidence"],
}

SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "missing_items": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": ["summary", "missing_items"],
}

RECOMMENDATIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "reason": {"type": "string"},
                    "severity": {"type": "string"},
                    "action": {"type": "string"},
                },
                "required": ["title", "reason", "severity", "action"],
            },
        }
    },
    "required": ["recommendations"],
}


class CopilotService:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm = llm_client or LLMClient()

    def parse_command(
        self,
        *,
        transcript: str,
        current_route: str,
        current_section: str | None,
        available_routes: list[str],
        available_patients: list[dict[str, str]] | None,
        available_sections: list[str],
        available_tools: list[str],
        available_pathways: list[str],
    ) -> dict[str, Any]:
        fallback = self._rule_based_command(
            transcript=transcript,
            available_routes=available_routes,
            available_patients=available_patients or [],
            available_sections=available_sections,
            available_tools=available_tools,
            available_pathways=available_pathways,
        )
        if fallback is not None:
            return fallback

        system = (
            "You are an ambient clinical copilot controller for an emergency department application. "
            "Your job is command understanding only, not clinical advice. "
            "Map the user's spoken command to one of these intents: "
            "navigate_route, navigate_section, next_step, previous_step, open_tool, select_pathway, "
            "generate_summary, get_recommendations, unknown. "
            "Only choose targets from the provided app routes, sections, tools, and pathways. "
            "Return strict JSON."
        )
        prompt = json.dumps(
            {
                "transcript": transcript,
                "current_route": current_route,
                "current_section": current_section,
                "available_routes": available_routes,
                "available_patients": available_patients or [],
                "available_sections": available_sections,
                "available_tools": available_tools,
                "available_pathways": available_pathways,
            }
        )

        try:
            return self._generate_json(system=system, prompt=prompt, schema=COMMAND_SCHEMA)
        except CopilotServiceError:
            return {
                "intent": "unknown",
                "response_text": "I understood the speech, but I could not map it to a local app action.",
                "confidence": 0.0,
            }

    def generate_summary(self, encounter_context: dict[str, Any]) -> dict[str, Any]:
        system = (
            "You are an emergency department documentation copilot. "
            "Summarize the encounter in concise clinical prose for the doctor's review. "
            "Do not invent facts. Call out missing required elements. Return strict JSON."
        )
        prompt = json.dumps(encounter_context)
        try:
            return self._generate_json(system=system, prompt=prompt, schema=SUMMARY_SCHEMA)
        except CopilotServiceError:
            return self._generate_summary_locally(encounter_context)

    def recommend(self, encounter_context: dict[str, Any]) -> dict[str, Any]:
        system = (
            "You are a clinical workflow copilot for an emergency department application. "
            "Based on the encounter context, suggest workflow nudges, likely calculators, and caution flags. "
            "Do not prescribe treatment. Phrase everything as suggestions for clinician confirmation. "
            "Return strict JSON."
        )
        prompt = json.dumps(encounter_context)
        try:
            return self._generate_json(system=system, prompt=prompt, schema=RECOMMENDATIONS_SCHEMA)
        except CopilotServiceError:
            return self._recommend_locally(encounter_context)

    def _generate_json(self, *, system: str, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        try:
            raw = self.llm.generate(system=system, prompt=prompt, format_schema=schema)
            return json.loads(raw)
        except LLMClientError as exc:
            raise CopilotServiceError(str(exc)) from exc
        except json.JSONDecodeError as exc:
            raise CopilotServiceError("The LLM returned invalid JSON.") from exc

    def _rule_based_command(
        self,
        *,
        transcript: str,
        available_routes: list[str],
        available_patients: list[dict[str, str]],
        available_sections: list[str],
        available_tools: list[str],
        available_pathways: list[str],
    ) -> dict[str, Any] | None:
        lower = transcript.lower().strip()
        normalized = self._normalize_text(transcript)
        actions: list[dict[str, Any]] = []

        if self._looks_like_new_patient_registration(normalized) or self._looks_like_patient_intake(normalized):
            register_route = self._find_route(available_routes, "/register")
            if register_route is not None:
                return {
                    "intent": "navigate_route",
                    "route": register_route,
                    "response_text": "Opening new patient registration.",
                    "confidence": 0.99,
                }

            return {
                "intent": "unknown",
                "response_text": "I recognized a new patient registration request, but the registration screen is not available here.",
                "confidence": 0.0,
            }

        if normalized in {"next", "next page", "next section", "go next", "continue", "continue next"}:
            return {"intent": "next_step", "response_text": "Moving to the next section.", "confidence": 0.99}
        if normalized in {"back", "go back", "previous", "previous step", "previous page"}:
            return {"intent": "previous_step", "response_text": "Going back to the previous section.", "confidence": 0.99}
        if "summary" in normalized:
            return {"intent": "generate_summary", "response_text": "Generating encounter summary.", "confidence": 0.9}
        if "recommend" in normalized or "suggest" in normalized or "nudge" in normalized:
            return {"intent": "get_recommendations", "response_text": "Reviewing encounter suggestions.", "confidence": 0.9}

        tool_aliases = {
            "add vitals": ["vitals", "record vitals", "capture vitals", "open vitals", "enter vitals"],
            "scoring tools": ["scoring tool", "scoring tools", "calculator", "calculators", "mews", "news2", "qsofa", "sofa", "apache"],
            "add orders": ["orders", "order set", "open orders", "add order", "add orders"],
            "voice fill": ["voice fill", "dictate", "start dictation", "record note"],
            "nurse assessment": ["nurse assessment", "nursing assessment", "handoff checklist"],
        }

        explicit_tool: dict[str, Any] | None = None
        for tool in available_tools:
            tool_key = tool.lower()
            aliases = tool_aliases.get(tool_key, [])
            if self._contains_alias(normalized, tool_key, aliases):
                explicit_tool = {
                    "intent": "open_tool",
                    "tool": tool,
                }
                break

        section_aliases = {
            "er arrival": ["arrival", "registration", "patient registration", "er arrival"],
            "triage details": ["triage", "triage details", "vitals section"],
            "medication history": ["medication history", "med history", "medicine history", "drug history"],
            "clinical assessment": ["clinical assessment", "assessment", "chief complaint", "history"],
            "order set": ["order set", "orders"],
            "er outcome": ["outcome", "er outcome", "discharge"],
        }

        explicit_section: dict[str, Any] | None = None
        for section in available_sections:
            section_key = section.lower()
            aliases = section_aliases.get(section_key, [])
            if self._contains_alias(normalized, section_key, aliases):
                explicit_section = {
                    "intent": "navigate_section",
                    "target": section,
                }
                break

        route_aliases = {
            "/dashboard": ["dashboard", "home"],
            "/patients": ["patients", "patient list"],
            "/register": ["register", "registration", "new patient", "patient registration", "register patient", "new case"],
            "/settings": ["settings", "preferences"],
            "/masters/medications": ["medication master", "medications master"],
            "/masters/lab-panels": ["lab panel master", "lab panels"],
            "/rapid": ["rapid", "rapid emergency", "rapid mode"],
        }

        for route in available_routes:
            route_key = route.lower()
            aliases = route_aliases.get(route_key, [])
            if self._contains_alias(normalized, route_key, aliases):
                return {
                    "intent": "navigate_route",
                    "route": route,
                    "actions": [{"intent": "navigate_route", "route": route}],
                    "response_text": f"Opening {route}.",
                    "confidence": 0.95,
                }

        best_patient_match: dict[str, Any] | None = None
        best_patient_score = 0.0

        for patient in available_patients:
            patient_name = patient.get("name", "")
            patient_id = patient.get("id", "")
            if not patient_name or not patient_id:
                continue

            normalized_name = self._normalize_text(patient_name)
            if self._matches_patient_command(normalized, normalized_name):
                actions.append(
                    {
                        "intent": "open_patient",
                        "patient_id": patient_id,
                        "patient_name": patient_name,
                    }
                )
                break

            similarity = self._patient_similarity(normalized, normalized_name)
            if similarity > best_patient_score:
                best_patient_score = similarity
                best_patient_match = {
                    "intent": "open_patient",
                    "patient_id": patient_id,
                    "patient_name": patient_name,
                    "response_text": f"Opening {patient_name}'s file.",
                    "confidence": round(similarity, 2),
                }

        if not actions and best_patient_match and best_patient_score >= 0.9 and self._looks_like_patient_open_request(normalized):
            actions.append(
                {
                    "intent": "open_patient",
                    "patient_id": best_patient_match["patient_id"],
                    "patient_name": best_patient_match["patient_name"],
                }
            )

        if explicit_section is not None:
            actions.append(explicit_section)

        if explicit_tool is not None:
            actions.append(explicit_tool)

        extracted_vitals = self._extract_vitals(normalized)
        if extracted_vitals:
            has_explicit_vitals_tool = any(
                action["intent"] == "open_tool" and action.get("tool") == "Add Vitals"
                for action in actions
            )
            if (
                not has_explicit_vitals_tool
                and any(keyword in normalized for keyword in ["vitals", "vital", "bp", "blood pressure", "oxygen", "temperature", "pulse", "heart rate"])
            ):
                actions.append({"intent": "open_tool", "tool": "Add Vitals"})
            actions.append({"intent": "apply_vitals", "vitals": extracted_vitals})

        extracted_chief_complaint = self._extract_chief_complaint(normalized)
        if extracted_chief_complaint:
            actions.append({"intent": "apply_chief_complaint", "target": extracted_chief_complaint})

        inferred_pathway = self._infer_pathway_from_symptoms(normalized, available_pathways)
        if inferred_pathway is not None:
            actions.append({"intent": "select_pathway", "pathway": inferred_pathway})

        for pathway in available_pathways:
            normalized_pathway = self._normalize_text(pathway)
            if (
                normalized_pathway in normalized
                or f"{normalized_pathway} pathway" in normalized
                or f"select {normalized_pathway}" in normalized
                or f"open {normalized_pathway}" in normalized
            ):
                actions.append({"intent": "select_pathway", "pathway": pathway})
                break

        if actions:
            primary = actions[0]
            response_parts: list[str] = []
            if primary["intent"] == "open_patient":
                response_parts.append(f"Opening {primary.get('patient_name', 'patient')} file.")
            elif primary["intent"] == "navigate_route":
                response_parts.append(f"Opening {primary.get('route', 'requested route')}.")

            if any(action["intent"] == "open_tool" and action.get("tool") == "Add Vitals" for action in actions):
                response_parts.append("Preparing vitals entry.")
            if any(action["intent"] == "apply_vitals" for action in actions):
                response_parts.append("Applying recognized vitals.")
            if any(action["intent"] == "apply_chief_complaint" for action in actions):
                chief_complaint = next((action.get("target") for action in actions if action["intent"] == "apply_chief_complaint"), None)
                if chief_complaint:
                    response_parts.append(f"Recording chief complaint as {chief_complaint}.")
            if any(action["intent"] == "select_pathway" for action in actions):
                pathway_name = next((action.get("pathway") for action in actions if action["intent"] == "select_pathway"), None)
                if pathway_name:
                    response_parts.append(f"Selecting {pathway_name} pathway.")

            return {
                "intent": primary["intent"],
                "target": primary.get("target"),
                "tool": primary.get("tool"),
                "pathway": primary.get("pathway"),
                "route": primary.get("route"),
                "patient_id": primary.get("patient_id"),
                "patient_name": primary.get("patient_name"),
                "vitals": extracted_vitals or None,
                "actions": actions,
                "response_text": " ".join(response_parts) or "Applying command chain.",
                "confidence": 0.95,
            }

        return None

    def _normalize_text(self, value: str) -> str:
        lowered = value.lower().strip()
        lowered = re.sub(r"['’]s\b", "", lowered)
        lowered = re.sub(r"[^a-z0-9]+", " ", lowered)
        return re.sub(r"\s+", " ", lowered).strip()

    def _contains_alias(self, normalized: str, primary: str, aliases: list[str]) -> bool:
        normalized_primary = self._normalize_text(primary)
        if normalized_primary and normalized_primary in normalized:
            return True

        for alias in aliases:
            normalized_alias = self._normalize_text(alias)
            if normalized_alias and normalized_alias in normalized:
                return True

        return False

    def _matches_patient_command(self, normalized_transcript: str, normalized_name: str) -> bool:
        if not normalized_name:
            return False

        has_opening_keyword = self._looks_like_patient_open_request(normalized_transcript)
        if not has_opening_keyword:
            return False

        if normalized_name in normalized_transcript:
            return True

        name_tokens = normalized_name.split()
        transcript_tokens = set(normalized_transcript.split())
        return all(token in transcript_tokens for token in name_tokens)

    def _looks_like_patient_open_request(self, normalized_transcript: str) -> bool:
        if self._looks_like_new_patient_registration(normalized_transcript):
            return False

        return any(
            keyword in normalized_transcript
            for keyword in ["open", "patient", "file", "chart", "workspace", "record", "show", "take me to", "go to"]
        )

    def _looks_like_new_patient_registration(self, normalized_transcript: str) -> bool:
        return any(
            phrase in normalized_transcript
            for phrase in [
                "new patient",
                "register patient",
                "patient registration",
                "register new patient",
                "create patient",
                "new case",
            ]
        )

    def _looks_like_patient_intake(self, normalized_transcript: str) -> bool:
        has_identity_signal = any(
            phrase in normalized_transcript
            for phrase in [
                "name is",
                "patient name is",
                "named",
                "years old",
                "year old",
                "male patient",
                "female patient",
                "he is a",
                "she is a",
            ]
        )

        has_clinical_signal = any(
            phrase in normalized_transcript
            for phrase in [
                "complains of",
                "complaining of",
                "chief complaint",
                "chest pain",
                "shortness of breath",
                "dizziness",
                "fever",
                "walk in",
                "walk in patient",
                "arrival mode",
            ]
        )

        return has_identity_signal and has_clinical_signal

    def _find_route(self, available_routes: list[str], target_route: str) -> str | None:
        for route in available_routes:
            if route.lower() == target_route.lower():
                return route
        return None

    def _patient_similarity(self, normalized_transcript: str, normalized_name: str) -> float:
        if not normalized_transcript or not normalized_name:
            return 0.0

        if normalized_name in normalized_transcript:
            return 1.0

        name_tokens = normalized_name.split()
        transcript_tokens = normalized_transcript.split()
        if not name_tokens or not transcript_tokens:
            return 0.0

        token_scores: list[float] = []
        for name_token in name_tokens:
            best_token_score = 0.0
            for transcript_token in transcript_tokens:
                score = SequenceMatcher(None, name_token, transcript_token).ratio()
                if score > best_token_score:
                    best_token_score = score
            token_scores.append(best_token_score)

        exact_token_hits = sum(1 for token in name_tokens if token in transcript_tokens)
        if exact_token_hits < max(1, len(name_tokens) - 1):
            return 0.0

        transcript_similarity = SequenceMatcher(None, normalized_name, normalized_transcript).ratio()
        token_average = sum(token_scores) / len(token_scores)
        return max(token_average, transcript_similarity)

    def _infer_pathway_from_symptoms(self, normalized_transcript: str, available_pathways: list[str]) -> str | None:
        symptom_aliases = {
            "chest pain": [
                "chest pain",
                "chest discomfort",
                "chest tightness",
                "chest pressure",
                "stemi",
                "angina",
                "heart attack",
                "cardiac pain",
            ],
            "shortness of breath": [
                "shortness of breath",
                "difficulty breathing",
                "breathing difficulty",
                "breathlessness",
                "sob",
                "mild shortness of breath",
            ],
            "stroke": [
                "stroke",
                "facial droop",
                "slurred speech",
                "one sided weakness",
                "hemiparesis",
            ],
            "sepsis": [
                "sepsis",
                "septic",
                "fever with low blood pressure",
                "suspected infection",
            ],
            "polytrauma": [
                "polytrauma",
                "major trauma",
                "road traffic accident",
                "multiple injuries",
            ],
            "poisoning": [
                "poisoning",
                "poison",
                "overdose",
                "toxic ingestion",
            ],
            "snakebite": [
                "snakebite",
                "snake bite",
                "bite by snake",
                "envenomation",
            ],
            "pneumonia": [
                "pneumonia",
                "productive cough",
                "cough with fever",
            ],
        }

        best_match: tuple[str, float] | None = None
        available_lookup = {self._normalize_text(pathway): pathway for pathway in available_pathways}

        for pathway_key, aliases in symptom_aliases.items():
            if pathway_key not in available_lookup:
                continue

            score = self._best_alias_score(normalized_transcript, aliases)
            if best_match is None or score > best_match[1]:
                best_match = (available_lookup[pathway_key], score)

        if best_match and best_match[1] >= 0.84:
            return best_match[0]

        return None

    def _best_alias_score(self, normalized_transcript: str, aliases: list[str]) -> float:
        best_score = 0.0
        transcript_tokens = normalized_transcript.split()

        for alias in aliases:
            normalized_alias = self._normalize_text(alias)
            if not normalized_alias:
                continue

            if normalized_alias in normalized_transcript:
                return 1.0

            alias_tokens = normalized_alias.split()
            window_sizes = {max(1, len(alias_tokens) - 1), len(alias_tokens), len(alias_tokens) + 1}

            for window_size in window_sizes:
                if window_size <= 0 or window_size > len(transcript_tokens):
                    continue

                for start in range(0, len(transcript_tokens) - window_size + 1):
                    window = " ".join(transcript_tokens[start : start + window_size])
                    score = SequenceMatcher(None, normalized_alias, window).ratio()
                    if score > best_score:
                        best_score = score

        return best_score

    def _extract_vitals(self, normalized_transcript: str) -> dict[str, str]:
        vitals: dict[str, str] = {}

        bp_match = re.search(r"(?:bp|blood pressure)\s*(?:is\s*)?(\d{2,3})\s*(?:by|over|/)\s*(\d{2,3})", normalized_transcript)
        if bp_match:
            vitals["sbp"] = bp_match.group(1)
            vitals["dbp"] = bp_match.group(2)

        spo2_match = re.search(r"(?:oxygen(?: levels?)?|spo2|saturation)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)", normalized_transcript)
        if spo2_match:
            vitals["spo2"] = spo2_match.group(1)

        temp_match = re.search(r"(?:temperature|temp)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)", normalized_transcript)
        if temp_match:
            vitals["temp"] = temp_match.group(1)

        hr_match = re.search(r"(?:heart rate|pulse|hr)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)", normalized_transcript)
        if hr_match:
            vitals["hr"] = hr_match.group(1)

        rr_match = re.search(r"(?:respiratory rate|resp rate|rr)\s*(?:is\s*)?(\d{1,2}(?:\.\d+)?)", normalized_transcript)
        if rr_match:
            vitals["rr"] = rr_match.group(1)

        grbs_match = re.search(r"(?:grbs|blood sugar|glucose)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)", normalized_transcript)
        if grbs_match:
            vitals["grbs"] = grbs_match.group(1)

        return vitals

    def _extract_chief_complaint(self, normalized_transcript: str) -> str | None:
        """Extract chief complaint from normalized transcript."""
        # Look for explicit patterns: "chief complaint is..." or "presenting with..."
        explicit_patterns = [
            r"chief complaint (?:is |as )?(.+?)(?:\.|$)",
            r"presenting (?:with|complaint) (.+?)(?:\.|$)",
            r"complain[ts]? (?:is |of )?(.+?)(?:\.|$)",
        ]
        
        for pattern in explicit_patterns:
            match = re.search(pattern, normalized_transcript, re.IGNORECASE)
            if match:
                complaint = match.group(1).strip()
                if complaint:
                    # Title case the complaint
                    return " ".join(word.capitalize() for word in complaint.split())
        
        # Fall back to symptom keywords with title casing
        symptom_patterns = [
            (r"\bsnake bite\b", "Snake bite"),
            (r"\bchest pain\b", "Chest pain"),
            (r"\bstroke\b|\bfacial droop\b", "Stroke symptoms"),
            (r"\bfever\b", "Fever"),
            (r"\bcough\b", "Cough"),
            (r"\bshortness of breath\b|\bdyspnea\b", "Shortness of breath"),
            (r"\babdominal pain\b", "Abdominal pain"),
            (r"\bnausea\b", "Nausea"),
            (r"\bvomiting\b", "Vomiting"),
            (r"\bbleeding\b", "Bleeding"),
            (r"\bdizziness\b|\bdizzy\b", "Dizziness"),
            (r"\bheadache\b", "Headache"),
            (r"\btrauma\b", "Trauma"),
            (r"\bsepsis\b", "Sepsis"),
            (r"\bpoisoning\b", "Poisoning"),
        ]
        
        for pattern, label in symptom_patterns:
            if re.search(pattern, normalized_transcript, re.IGNORECASE):
                return label
        
        return None

    def _generate_summary_locally(self, encounter_context: dict[str, Any]) -> dict[str, Any]:
        patient_name = encounter_context.get("patientName") or "the patient"
        current_section = encounter_context.get("currentSection") or "current encounter"
        chief_complaint = encounter_context.get("chiefComplaint") or "chief complaint not yet documented"
        pathway = encounter_context.get("pathway") or "pathway pending selection"
        vitals = encounter_context.get("vitals") or {}
        notes = encounter_context.get("notes") or []

        vitals_summary = []
        if vitals.get("sbp") and vitals.get("dbp"):
            vitals_summary.append(f"BP {vitals['sbp']}/{vitals['dbp']}")
        if vitals.get("hr"):
            vitals_summary.append(f"HR {vitals['hr']}")
        if vitals.get("spo2"):
            vitals_summary.append(f"SpO2 {vitals['spo2']}")
        if vitals.get("temp"):
            vitals_summary.append(f"Temp {vitals['temp']}")

        summary_parts = [
            f"{patient_name} is currently in {current_section}.",
            f"Chief complaint: {chief_complaint}.",
            f"Care pathway: {pathway}.",
        ]
        if vitals_summary:
            summary_parts.append(f"Recorded vitals: {', '.join(vitals_summary)}.")
        if notes:
            summary_parts.append(f"Orders and notes captured: {', '.join(notes[:3])}.")

        missing_items: list[str] = []
        if not encounter_context.get("chiefComplaint"):
            missing_items.append("Chief complaint")
        if not encounter_context.get("pathway"):
            missing_items.append("Care pathway")
        if not vitals.get("sbp") or not vitals.get("dbp"):
            missing_items.append("Blood pressure")
        if not vitals.get("spo2"):
            missing_items.append("Oxygen saturation")

        return {
            "summary": " ".join(summary_parts),
            "missing_items": missing_items,
        }

    def _recommend_locally(self, encounter_context: dict[str, Any]) -> dict[str, Any]:
        recommendations: list[dict[str, str]] = []

        chief_complaint = str(encounter_context.get("chiefComplaint") or "").lower()
        pathway = str(encounter_context.get("pathway") or "")
        vitals = encounter_context.get("vitals") or {}

        if chief_complaint or pathway:
            recommendations.append(
                {
                    "title": "Confirm AI-suggested pathway",
                    "reason": f"The current encounter is aligned to {pathway or 'the active complaint context'}.",
                    "severity": "info",
                    "action": "Review the care pathway and confirm it matches the presentation before proceeding.",
                }
            )

        if "chest" in chief_complaint or pathway == "Chest Pain":
            recommendations.append(
                {
                    "title": "Chest pain workflow nudge",
                    "reason": "Chest pain presentations commonly require early ECG review and cardiac workup.",
                    "severity": "high",
                    "action": "Consider ECG, Troponin, and cardiac monitoring if not already initiated.",
                }
            )

        if "breath" in chief_complaint or pathway == "Shortness of Breath":
            recommendations.append(
                {
                    "title": "Respiratory assessment reminder",
                    "reason": "Shortness of breath should be paired with documented SpO2 and escalation assessment.",
                    "severity": "medium",
                    "action": "Confirm oxygen saturation, respiratory rate, and whether airway support is required.",
                }
            )

        try:
            spo2 = float(vitals.get("spo2", "")) if vitals.get("spo2") else None
        except ValueError:
            spo2 = None
        if spo2 is not None and spo2 < 94:
            recommendations.append(
                {
                    "title": "Low oxygen saturation",
                    "reason": f"Recorded SpO2 is {spo2}, which may need escalation review.",
                    "severity": "high",
                    "action": "Recheck saturation, verify oxygen support, and review the active respiratory pathway.",
                }
            )

        if not vitals.get("sbp") or not vitals.get("dbp"):
            recommendations.append(
                {
                    "title": "Missing blood pressure",
                    "reason": "Blood pressure is still incomplete for the current encounter.",
                    "severity": "medium",
                    "action": "Capture BP so triage scoring and pathway logic have complete hemodynamic context.",
                }
            )

        if not chief_complaint:
            recommendations.append(
                {
                    "title": "Chief complaint needed",
                    "reason": "The AI suggestion layer becomes more precise once the complaint is documented.",
                    "severity": "info",
                    "action": "Select or dictate the chief complaint to unlock pathway-specific guidance.",
                }
            )

        return {"recommendations": recommendations[:5]}
