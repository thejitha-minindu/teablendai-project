"""
Parameter Extractor

Uses LLM to extract structured parameters from natural language.
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.config import get_settings
from .auction_fields import (
    TeaGrade,
    VALID_ORIGINS,
    FIELD_DESCRIPTIONS,
    normalize_field_name,
    validate_field_value,
    parse_datetime,
)

settings = get_settings()
logger = logging.getLogger(__name__)
COLOMBO_TZ = ZoneInfo("Asia/Colombo")


class ParameterExtractor:
    """Extract structured parameters from natural language using LLM"""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0
        )

    def _format_minutes_for_display(self, total_minutes: int) -> str:
        """Format minutes as human-friendly hours/minutes text."""
        hours = total_minutes // 60
        minutes = total_minutes % 60

        parts = []
        if hours:
            parts.append(f"{hours} hour" + ("s" if hours != 1 else ""))
        if minutes:
            parts.append(f"{minutes} minute" + ("s" if minutes != 1 else ""))

        if not parts:
            return "0 minutes"
        return " ".join(parts)

    def _normalize_duration_minutes(
        self,
        user_message: str,
        extracted_value: Any
    ) -> Tuple[Optional[int], Optional[str], Optional[str]]:
        """
        Normalize duration to minutes for backend use while preserving a display label.

        Returns:
            (duration_minutes, duration_display, input_unit)
        """
        message_lower = user_message.lower()

        hour_pattern = r"(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h)\b"
        minute_pattern = r"(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|m)\b"

        hour_match = re.search(hour_pattern, message_lower)
        minute_match = re.search(minute_pattern, message_lower)

        try:
            numeric_value = float(extracted_value)
        except (TypeError, ValueError):
            numeric_value = None

        if hour_match:
            hours_value = float(hour_match.group(1))
            duration_minutes = int(round(hours_value * 60))
            display = f"{hours_value:g} hour" + ("s" if hours_value != 1 else "")
            return duration_minutes, display, "hours"

        if minute_match:
            duration_minutes = int(round(float(minute_match.group(1))))
            return duration_minutes, self._format_minutes_for_display(duration_minutes), "minutes"

        if numeric_value is None:
            return None, None, None

        # Fallback heuristic when unit is not explicit.
        if numeric_value <= 24:
            duration_minutes = int(round(numeric_value * 60))
            display = f"{numeric_value:g} hour" + ("s" if numeric_value != 1 else "")
            return duration_minutes, display, "hours"

        duration_minutes = int(round(numeric_value))
        return duration_minutes, self._format_minutes_for_display(duration_minutes), "minutes"

    def _format_time_12h(self, hour_24: int, minute: int) -> str:
        return datetime.strptime(f"{hour_24:02d}:{minute:02d}", "%H:%M").strftime("%I:%M %p")

    def _coerce_time_components(
        self,
        hour_raw: str,
        minute_raw: Optional[str],
        meridiem: Optional[str],
        default_period: Optional[str] = None,
    ) -> Optional[Tuple[int, int]]:
        try:
            hour = int(hour_raw)
            minute = int(minute_raw) if minute_raw is not None else 0
        except ValueError:
            return None

        if minute < 0 or minute > 59:
            return None

        period = (meridiem or default_period or "").lower()

        if period in {"am", "pm"}:
            if hour < 1 or hour > 12:
                return None
            if period == "am":
                hour = 0 if hour == 12 else hour
            else:
                hour = 12 if hour == 12 else hour + 12
            return hour, minute

        if hour < 0 or hour > 23:
            return None

        return hour, minute

    def _ensure_future_datetime(self, candidate: datetime, step: timedelta, now: datetime) -> datetime:
        while candidate <= now:
            candidate += step
        return candidate

    def _extract_natural_origin(self, user_message: str) -> Optional[str]:
        """Deterministically extract origin region from message text."""
        message = user_message.lower()

        for origin in VALID_ORIGINS:
            escaped = re.escape(origin.lower())
            if re.search(rf"\b{escaped}\b", message):
                return origin

        return None

    def _extract_natural_duration(
        self,
        user_message: str,
    ) -> Tuple[Optional[int], Optional[str], Optional[str]]:
        """Deterministically extract duration from message text (e.g., 15h, 30 min)."""
        message_lower = user_message.lower()

        hour_pattern = r"(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h)\b"
        minute_pattern = r"(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|m)\b"

        hour_match = re.search(hour_pattern, message_lower)
        if hour_match:
            hours_value = float(hour_match.group(1))
            duration_minutes = int(round(hours_value * 60))
            display = f"{hours_value:g} hour" + ("s" if hours_value != 1 else "")
            return duration_minutes, display, "hours"

        minute_match = re.search(minute_pattern, message_lower)
        if minute_match:
            duration_minutes = int(round(float(minute_match.group(1))))
            return duration_minutes, self._format_minutes_for_display(duration_minutes), "minutes"

        return None, None, None

    def _extract_natural_estate_name(self, user_message: str) -> Optional[str]:
        """Deterministically extract estate name from short free-text replies."""
        if not user_message:
            return None

        value = user_message.strip().strip('"').strip("'")
        if not value:
            return None

        lowered = value.lower()
        stop_words = {
            "skip", "none", "no", "n/a", "na", "not sure", "unknown",
            "yes", "ok", "okay", "confirm", "cancel", "change",
        }
        if lowered in stop_words:
            return None

        # Handle prefixed forms like: estate: Kandy Valley Estate
        for prefix in ("estate name", "estate"):
            if lowered.startswith(prefix):
                parts = value.split(":", 1)
                if len(parts) == 2 and parts[1].strip():
                    return parts[1].strip()

        return value

    def _extract_natural_start_time(self, user_message: str) -> Optional[Dict[str, Any]]:
        """
        Deterministically extract natural-language start times.

        Supports:
        - Relative day: today, tonight, this evening, tomorrow, tomorrow evening,
          tomorrow night, day after tomorrow
        - Weekdays: monday..sunday with optional this/next modifiers
        - Relative time: in/after/from now (e.g., in 2 hours, after 30 minutes)

        Returns:
            {
                "start_time": "YYYY-MM-DD HH:MM",
                "requires_weekday_confirmation": bool,
                "expression": "matched phrase",
                "display_time_12h": "HH:MM AM/PM"
            }
        """
        message = user_message.lower()
        now = datetime.now(COLOMBO_TZ)

        # Relative time expressions: "in 2 hours", "after 30 minutes", "2 hours from now"
        relative_patterns = [
            r"\b(?:in|after)\s+(\d{1,4})\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)\b",
            r"\b(\d{1,4})\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)\s+from\s+now\b",
        ]

        for pattern in relative_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if not match:
                continue

            amount = int(match.group(1))
            unit = match.group(2).lower()

            if unit.startswith("h"):
                candidate = now + timedelta(hours=amount)
            else:
                candidate = now + timedelta(minutes=amount)

            return {
                "start_time": candidate.strftime("%Y-%m-%d %H:%M"),
                "requires_weekday_confirmation": False,
                "expression": match.group(0),
                "display_time_12h": candidate.strftime("%I:%M %p"),
            }

        time_expr = r"(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b"

        # Relative day expressions with optional day context hints for ambiguous times
        relative_day_patterns = [
            (r"\bday\s+after\s+tomorrow\b(?:\s+at)?\s+" + time_expr, 2, None, "day after tomorrow"),
            (r"\btomorrow\s+evening\b(?:\s+at)?\s+" + time_expr, 1, "pm", "tomorrow evening"),
            (r"\btomorrow\s+night\b(?:\s+at)?\s+" + time_expr, 1, "pm", "tomorrow night"),
            (r"\btomorrow\b(?:\s+at)?\s+" + time_expr, 1, None, "tomorrow"),
            (r"\bthis\s+evening\b(?:\s+at)?\s+" + time_expr, 0, "pm", "this evening"),
            (r"\btonight\b(?:\s+at)?\s+" + time_expr, 0, "pm", "tonight"),
            (r"\btoday\b(?:\s+at)?\s+" + time_expr, 0, None, "today"),
        ]

        for pattern, day_offset, default_period, expression_label in relative_day_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if not match:
                continue

            hour_raw, minute_raw, meridiem = match.group(1), match.group(2), match.group(3)
            parsed_time = self._coerce_time_components(hour_raw, minute_raw, meridiem, default_period=default_period)
            if not parsed_time:
                return None

            hour_24, minute = parsed_time
            base_date = now.date() + timedelta(days=day_offset)
            candidate = datetime.combine(base_date, datetime.min.time(), tzinfo=COLOMBO_TZ).replace(
                hour=hour_24,
                minute=minute,
            )
            candidate = self._ensure_future_datetime(candidate, timedelta(days=1), now)

            return {
                "start_time": candidate.strftime("%Y-%m-%d %H:%M"),
                "requires_weekday_confirmation": False,
                "expression": expression_label,
                "display_time_12h": self._format_time_12h(hour_24, minute),
            }

        # Weekday expressions: this/next Monday, Monday, this Sunday, next Friday
        weekdays = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        weekday_pattern = (
            r"\b(?:(this|next)\s+)?"
            r"(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b"
            r"(?:\s+at)?\s+"
            + time_expr
        )
        weekday_match = re.search(weekday_pattern, message, re.IGNORECASE)
        if weekday_match:
            modifier = (weekday_match.group(1) or "").lower()
            weekday_name = weekday_match.group(2).lower()
            hour_raw, minute_raw, meridiem = weekday_match.group(3), weekday_match.group(4), weekday_match.group(5)

            default_period = "pm" if "evening" in message or "night" in message else None
            parsed_time = self._coerce_time_components(hour_raw, minute_raw, meridiem, default_period=default_period)
            if not parsed_time:
                return None

            hour_24, minute = parsed_time
            target_weekday = weekdays[weekday_name]
            today_weekday = now.weekday()
            days_ahead = (target_weekday - today_weekday) % 7

            if modifier == "next":
                days_ahead = days_ahead + 7 if days_ahead != 0 else 7

            candidate_date = now.date() + timedelta(days=days_ahead)
            candidate = datetime.combine(candidate_date, datetime.min.time(), tzinfo=COLOMBO_TZ).replace(
                hour=hour_24,
                minute=minute,
            )

            if modifier == "":
                candidate = self._ensure_future_datetime(candidate, timedelta(days=7), now)
            elif modifier == "this" and candidate <= now:
                candidate += timedelta(days=7)

            requires_confirmation = modifier == ""
            expression = f"{weekday_name} at {self._format_time_12h(hour_24, minute)}"

            return {
                "start_time": candidate.strftime("%Y-%m-%d %H:%M"),
                "requires_weekday_confirmation": requires_confirmation,
                "expression": expression,
                "display_time_12h": self._format_time_12h(hour_24, minute),
            }

        return None
    
    async def extract_parameters(
        self,
        user_message: str,
        expected_fields: List[str],
        context: Dict[str, Any] = None,
        reference_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Extract parameters from user message.
        
        Args:
            user_message: User's natural language message
            expected_fields: List of field names we're trying to extract
            context: Optional context from previous messages
        
        Returns:
            Dictionary of extracted parameters
        """
        try:
            # Build field descriptions
            field_descriptions_text = "\n".join([
                f"- {field}: {FIELD_DESCRIPTIONS.get(field, 'No description')}"
                for field in expected_fields
            ])
            
            # Build context text
            context_text = ""
            if context:
                context_text = f"\nAlready collected:\n{json.dumps(context, indent=2)}\n"
            
            system = SystemMessage(content=f"""
                You are a parameter extraction assistant for a tea auction system.

                Extract structured information from the user's message.

                Expected fields:
                {field_descriptions_text}

                Valid tea grades: BOP, BOPF, OP, OP1, Pekoe, Fannings, Dust, FBOP, OPA, Pekoe 1, Dust 1, Silver Tips, Golden Tips
                Valid origins: Nuwara Eliya, Kandy, Dimbula, Uva, Ruhuna, Sabaragamuwa, Uda Pussellawa, Ratnapura

                Rules:
                1. Only extract fields that are explicitly mentioned
                2. Return ONLY valid JSON
                3. Use exact field names from the list above
                4. For grade, use exact values from valid tea grades
                5. For numbers (quantity, base_price, duration), return as numbers (not strings)
                6. For start_time, extract date and time if mentioned
                7. For missing fields, do NOT include them in output
                8. If user says "skip" or "no" for optional field, return null

                Examples:
                User: "Create auction for 1000kg BOPF tea from Kandy at 17000 LKR"
                Output: {{"grade": "BOPF", "quantity": 1000, "origin": "Kandy", "base_price": 17000}}

                User: "Starting at 2pm tomorrow for 30 minutes"
                Output: {{"start_time": "tomorrow at 2:00 PM", "duration": 30}}

                User: "500 kilograms"
                Output: {{"quantity": 500}}

                Return format (JSON only, no explanation):
                {{
                "field_name": value
                }}
            """)
                            
            human = HumanMessage(content=f"""
                {context_text}
                User message: "{user_message}"

                Extract parameters as JSON:
            """)
            
            response = await self.llm.ainvoke([system, human])
            raw = response.content.strip()
            
            # Clean markdown
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].strip()
            
            # Parse JSON
            extracted = json.loads(raw)
            
            # Normalize field names
            normalized = {}
            for key, value in extracted.items():
                normalized_key = normalize_field_name(key)
                normalized[normalized_key] = value

            if "origin" in expected_fields:
                natural_origin = self._extract_natural_origin(user_message)
                if natural_origin and not normalized.get("origin"):
                    normalized["origin"] = natural_origin

            if "duration" in expected_fields and "duration" not in normalized:
                natural_duration, natural_duration_display, natural_duration_unit = self._extract_natural_duration(user_message)
                if natural_duration is not None:
                    normalized["duration"] = natural_duration
                    normalized["_duration_display"] = natural_duration_display
                    normalized["_duration_input_unit"] = natural_duration_unit

            natural_start_time = None
            if "start_time" in expected_fields:
                natural_start_time = self._extract_natural_start_time(user_message)
                if natural_start_time:
                    normalized["start_time"] = natural_start_time["start_time"]

            if "estate_name" in expected_fields and not normalized.get("estate_name"):
                natural_estate_name = self._extract_natural_estate_name(user_message)
                if natural_estate_name:
                    normalized["estate_name"] = natural_estate_name
            
            # Validate extracted values (especially start_time)
            validated = {}
            validation_errors = []

            for field, value in normalized.items():
                if field == "duration":
                    duration_minutes, duration_display, input_unit = self._normalize_duration_minutes(
                        user_message,
                        value
                    )

                    if duration_minutes is None:
                        error_msg = "Duration must be a valid number (e.g., 2 hours)"
                        logger.warning(f"[Extractor] Validation failed for {field}: {error_msg}")
                        validation_errors.append({"field": field, "error": error_msg})
                        continue

                    is_valid, error_msg = validate_field_value(field, duration_minutes)
                    if is_valid:
                        validated[field] = duration_minutes
                        validated["_duration_display"] = duration_display
                        validated["_duration_input_unit"] = input_unit
                    else:
                        logger.warning(f"[Extractor] Validation failed for {field}: {error_msg}")
                        validation_errors.append({"field": field, "error": error_msg})
                    continue

                is_valid, error_msg = validate_field_value(field, value, reference_time=reference_time)
                if is_valid:
                    if field == "start_time":
                        try:
                            parsed_start = parse_datetime(str(value))
                            # Keep timezone information so frontend can convert UTC to local time correctly.
                            validated[field] = parsed_start.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
                            if natural_start_time and natural_start_time.get("requires_weekday_confirmation"):
                                validated["_weekday_confirmation_required"] = True
                                validated["_weekday_confirmation_expression"] = natural_start_time.get("expression")
                                validated["_weekday_confirmation_time_12h"] = natural_start_time.get("display_time_12h")
                        except ValueError:
                            validated[field] = value
                        continue
                    if field == "origin":
                        canonical_origin = self._extract_natural_origin(str(value))
                        validated[field] = canonical_origin or value
                        continue
                    validated[field] = value
                else:
                    logger.warning(f"[Extractor] Validation failed for {field}: {error_msg}")
                    validation_errors.append({"field": field, "error": error_msg})

            # Store validation errors for later use in the handler
            if validation_errors:
                validated["_validation_errors"] = validation_errors
            
            logger.info(f"[Extractor] Extracted: {list(validated.keys())}")
            return validated
        
        except json.JSONDecodeError as e:
            logger.error(f"[Extractor] JSON parse error: {e}")
            logger.error(f"[Extractor] Raw response: {raw[:200]}")
            return {}
        except Exception as e:
            logger.error(f"[Extractor] Failed to extract parameters: {e}")
            return {}
    
    def detect_action_type(self, user_message: str) -> str:
        """
        Detect what action user wants to perform.
        
        Returns: "create", "update", "delete", "schedule", or "unknown"
        """
        msg = user_message.lower()
        
        if any(word in msg for word in ['update', 'change', 'modify', 'edit']):
            return "update"
        elif any(word in msg for word in ['delete', 'remove', 'cancel', 'close']):
            return "delete"
        elif any(word in msg for word in ['schedule', 'set time', 'set date', 'reschedule']):
            return "schedule"
        elif any(word in msg for word in ['create', 'new', 'add', 'start auction', 'list', 'post']):
            return "create"
        else:
            return "unknown"
    
    def extract_auction_id(self, user_message: str) -> Optional[str]:
        """
        Extract auction ID from message.
        
        Patterns:
        - "auction #127"
        - "auction 127"
        - "ID C7B7944E-CC6E-4EDB-BE1B-8EF71BD2E681"
        """
        msg = user_message.lower()
        
        # Try UUID pattern
        uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        uuid_match = re.search(uuid_pattern, msg, re.IGNORECASE)
        if uuid_match:
            return uuid_match.group(0).upper()
        
        # Try explicit custom/ref ID phrases first.
        custom_patterns = [
            r'(?:ref\s*id|reference\s*id|custom\s*auction\s*id)\s*[:#]?\s*([A-Za-z][A-Za-z0-9\-_]{5,})',
            r'auction\s*id\s*[:#]?\s*([A-Za-z][A-Za-z0-9\-_]{5,})',
        ]

        for pattern in custom_patterns:
            match = re.search(pattern, user_message, re.IGNORECASE)
            if match:
                return match.group(1)

        # Try number after "auction #" or "auction"
        number_patterns = [
            r'auction\s*#\s*(\d+)',
            r'auction\s+(\d+)',
            r'#\s*(\d+)',
            r'id\s*[:#]?\s*(\d+)'
        ]
        
        for pattern in number_patterns:
            match = re.search(pattern, msg)
            if match:
                return match.group(1)

        # Fallback: detect long alphanumeric token (likely custom auction ref id).
        token_match = re.search(r'\b([A-Za-z][A-Za-z0-9\-_]{8,})\b', user_message)
        if token_match:
            token = token_match.group(1)
            if token.lower() not in {
                "auction", "update", "delete", "remove", "cancel", "scheduled", "schedule", "live", "history"
            }:
                return token
        
        return None


# Singleton
parameter_extractor = ParameterExtractor()