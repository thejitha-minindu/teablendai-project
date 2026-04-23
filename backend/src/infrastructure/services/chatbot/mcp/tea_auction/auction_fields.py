"""
Auction Field Definitions
"""

from typing import Dict, Any, List, Tuple
from enum import Enum
from datetime import datetime, timedelta, timezone
import re


class AuctionStatus(str, Enum):
    """Valid auction statuses"""
    SCHEDULED = "Scheduled"
    LIVE = "Live"
    HISTORY = "History"


class TeaGrade(str, Enum):
    """Valid tea grades"""
    BOP = "BOP"
    BOPF = "BOPF"
    OP = "OP"
    OP1 = "OP1"
    PEKOE = "Pekoe"
    FANNINGS = "Fannings"
    DUST = "Dust"
    FBOP = "FBOP"

# Sri Lankan tea regions
VALID_ORIGINS = [
    "Nuwara Eliya",
    "Kandy",
    "Dimbula",
    "Uva",
    "Ruhuna",
    "Sabaragamuwa",
    "Uda Pussellawa",
    "Ratnapura"
]

# Minimum time in future for auction start (minutes)
MIN_FUTURE_TIME_MINUTES = 5

# Field definitions for CREATE auction
CREATE_AUCTION_FIELDS = {
    "required": [
        "grade",           # Tea grade (BOPF, Pekoe, etc.)
        "quantity",        # Quantity in kg
        "origin",          # Region (Nuwara Eliya, Kandy, etc.)
        "base_price",      # Starting price for entire lot (LKR)
        "start_time",      # Auction start datetime
        "duration"         # Duration in minutes
    ],
    "optional": [
        "description"      # Additional notes
    ],
    "auto_generated": [
        "auction_id",      # UUID - backend generates
        "custom_auction_id", # Seller+Grade+Origin+5-digit ID - backend generates
        "auction_name",    # "{grade} - {origin}" - backend generates
        "seller_id",       # From JWT token
        "seller_brand",    # From user profile (auto-filled)
        "company_name",    # From user profile (auto-filled)
        "estate_name",     # From user profile (auto-filled)
        "status",          # Initially "Scheduled"
        "created_at"       # Timestamp
    ]
}

# Field definitions for UPDATE auction
UPDATE_AUCTION_FIELDS = {
    "required": [
        "auction_id"       # Which auction to update (UUID)
    ],
    "optional": [
        "grade",
        "quantity",
        "origin",
        "base_price",
        "start_time",
        "duration",
        "description",
        "status"
    ]
}

# Field definitions for DELETE auction
DELETE_AUCTION_FIELDS = {
    "required": [
        "auction_id"       # Which auction to delete
    ],
    "optional": []
}

# Field definitions for SCHEDULE auction
SCHEDULE_AUCTION_FIELDS = {
    "required": [
        "auction_id",
        "start_time",
        "duration"
    ],
    "optional": []
}


# Natural language field name mappings
FIELD_NAME_ALIASES = {
    "grade": ["tea grade", "tea type", "type", "standard", "tea_standard", "tea"],
    "quantity": ["amount", "kg", "kilograms", "weight", "quantity_kg", "kgs"],
    "origin": ["region", "location", "area", "from", "estate region", "place"],
    "base_price": ["price", "starting price", "base", "cost", "starting bid"],
    "start_time": ["start", "begin", "start date", "when", "date and time", "time"],
    "duration": ["length", "how long", "time limit", "minutes", "period"],
    "description": ["notes", "details", "info", "description", "about"],
    "auction_id": ["id", "auction number", "auction #", "number", "#"],
}


# User-friendly field descriptions
FIELD_DESCRIPTIONS = {
    "grade": "Tea grade (BOP, BOPF, OP, OP1, Pekoe, Fannings, Dust, FBOP)",
    "quantity": "Quantity in kilograms",
    "origin": "Tea origin region (Nuwara Eliya, Kandy, Dimbula, Uva, Ruhuna, Sabaragamuwa, Uda Pussellawa, Ratnapura)",
    "base_price": "Starting bid price for entire lot (in LKR)",
    "start_time": f"Auction start date and time (must be at least {MIN_FUTURE_TIME_MINUTES} minutes in the future)",
    "duration": "Auction duration (you can provide in hours or minutes)",
    "description": "Additional description or notes (optional)",
    "auction_id": "Auction ID (UUID or number)",
    "status": "Auction status (Scheduled, Live, History)"
}


def get_field_question(field_name: str) -> str:
    """Generate natural question for collecting a field"""
    questions = {
        "grade": "What tea grade? (BOP, BOPF, OP, OP1, Pekoe, Fannings, Dust, or FBOP)",
        "quantity": "How many kilograms?",
        "origin": "What's the origin region? (e.g., Nuwara Eliya, Kandy, Dimbula, Uva, Ratnapura)",
        "base_price": "What's the starting bid price for the entire lot? (in LKR)",
        "start_time": f"When should the auction start? (Format: YYYY-MM-DD HH:MM, must be at least {MIN_FUTURE_TIME_MINUTES} minutes from now)",
        "duration": "How long should it run? (you can say 2 hours or 30 minutes)",
        "description": "Any additional description? (or say 'skip')",
        "auction_id": "What's the auction ID?",
    }
    
    return questions.get(field_name, f"Please provide {field_name}:")


def normalize_field_name(user_input: str) -> str:
    """
    Normalize user's field reference to canonical field name.
    
    Examples:
    - "tea grade" → "grade"
    - "price" → "base_price"
    - "quantity" → "quantity"
    """
    user_input_lower = user_input.lower().strip()
    
    for canonical, aliases in FIELD_NAME_ALIASES.items():
        if user_input_lower in aliases or user_input_lower == canonical:
            return canonical
    
    return user_input_lower


def parse_datetime(datetime_str: str) -> datetime:
    """
    Parse datetime string to timezone-aware datetime object.

    Supported formats:
    - "YYYY-MM-DD HH:MM"
    - "YYYY/MM/DD HH:MM"
    - "March 14, 2026, at 9:30 AM" (spelled-out month)
    - "14th March 2026 9:30"
    - "today at HH:MM AM/PM"
    - "tomorrow at HH:MM AM/PM"
    - Many more natural formats via dateutil
    
    Returns: timezone-aware datetime in UTC
    """

    from dateutil import parser as dateutil_parser

    datetime_str = datetime_str.strip()

    # Normalize common patterns
    normalized = datetime_str.lower()
    normalized = normalized.replace(" at ", " ")
    normalized = re.sub(r"(?<=\d)\.(?=\d)", ":", normalized)
    normalized = re.sub(r"(?i)(\d)(am|pm)\b", r"\1 \2", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    now = datetime.now(timezone.utc)

    # Handle relative dates (today, tomorrow)
    relative_prefixes = {
        "today": 0,
        "tomorrow": 1,
        "day after tomorrow": 2,
    }

    for prefix, day_offset in relative_prefixes.items():
        if normalized.startswith(prefix):
            time_part = normalized[len(prefix):].strip()
            if not time_part:
                raise ValueError("Missing time component. Use a format like 'today at 10:15 PM'.")

            base_date = (now + timedelta(days=day_offset)).date()
            time_formats = [
                "%I:%M %p",
                "%I %p",
                "%H:%M",
            ]

            for time_fmt in time_formats:
                try:
                    parsed_time = datetime.strptime(time_part.upper(), time_fmt).time()
                    # Combine with timezone-aware date
                    naive_dt = datetime.combine(base_date, parsed_time)
                    aware_dt = naive_dt.replace(tzinfo=timezone.utc)
                    return aware_dt
                except ValueError:
                    continue

            raise ValueError("Invalid time format for relative date. Use examples like 'today at 10:15 PM'.")
        
    try:
        parsed = dateutil_parser.parse(datetime_str, fuzzy=False)
        # If parsed datetime is naive, assume UTC; otherwise normalize to UTC.
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        else:
            parsed = parsed.astimezone(timezone.utc)
        return parsed
    except Exception:
        pass

    # Fallback to manual parsing for specific formats
    formats = [
        "%Y-%m-%d %H:%M",
        "%Y/%m/%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
        "%Y-%m-%d %I:%M %p",
        "%Y/%m/%d %I:%M %p",
        "%Y-%m-%d %I %p",
        "%Y/%m/%d %I %p",
    ]

    for fmt in formats:
        try:
            naive_dt = datetime.strptime(normalized.upper(), fmt)
            # Make it timezone-aware (UTC)
            aware_dt = naive_dt.replace(tzinfo=timezone.utc)
            return aware_dt
        except ValueError:
            continue

    raise ValueError(
        "Invalid datetime format. Use YYYY-MM-DD HH:MM or phrases like "
        "'March 14, 2026 at 9:30 AM' or 'today at 10:15 PM'"
    )

def validate_field_value(field_name: str, value: Any, reference_time: datetime = None) -> Tuple[bool, str]:
    """
    Validate a field value.
    
    Returns:
        (is_valid, error_message)
    """
    if value is None:
        return False, f"{field_name} cannot be empty"
    
    # Grade validation
    if field_name == "grade":
        valid_grades = [g.value for g in TeaGrade]
        if str(value).upper() not in [g.upper() for g in valid_grades]:
            return False, f"Grade must be one of: {', '.join(valid_grades)}"
    
    # Quantity validation
    elif field_name == "quantity":
        try:
            qty = float(value)
            if qty <= 0:
                return False, "Quantity must be greater than 0"
            if qty > 100000:  # Reasonable upper limit
                return False, "Quantity seems too large (max 100,000 kg)"
        except (ValueError, TypeError):
            return False, "Quantity must be a number"
    
    # Origin validation
    elif field_name == "origin":
        if str(value) not in VALID_ORIGINS:
            # Allow it but warn - user might have custom region
            pass
    
    # Price validation
    elif field_name == "base_price":
        try:
            price = float(value)
            if price <= 0:
                return False, "Price must be greater than 0"
            if price > 10000000:  # 10 million LKR
                return False, "Price seems too large"
        except (ValueError, TypeError):
            return False, "Price must be a number"
    
    # Duration validation
    elif field_name == "duration":
        try:
            duration_minutes = None

            if isinstance(value, str):
                normalized = value.strip().lower()

                hour_match = re.match(r"^(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h)$", normalized)
                minute_match = re.match(r"^(\d+(?:\.\d+)?)\s*(minutes?|mins?|min|m)$", normalized)

                if hour_match:
                    duration_minutes = int(round(float(hour_match.group(1)) * 60))
                elif minute_match:
                    duration_minutes = int(round(float(minute_match.group(1))))
                else:
                    duration_minutes = int(float(value))
            else:
                duration_minutes = int(float(value))

            if duration_minutes < 60:
                return False, "Duration must be greater than 1 hour"
            if duration_minutes > 4320:  # 72 hours
                return False, "Duration cannot exceed 72 hours"
        except (ValueError, TypeError):
            return False, "Duration must be a valid value like '2 hours' or '30 minutes'"
    
    elif field_name == "start_time":
        try:
            start_dt = parse_datetime(str(value))
            if reference_time is None:
                now = datetime.now(timezone.utc)
            elif reference_time.tzinfo is None:
                now = reference_time.replace(tzinfo=timezone.utc)
            else:
                now = reference_time.astimezone(timezone.utc)
            min_allowed_time = now + timedelta(minutes=MIN_FUTURE_TIME_MINUTES)

            if start_dt < min_allowed_time:
                time_diff = (min_allowed_time - start_dt).total_seconds() / 60
                if start_dt < now:
                    return False, "Start time cannot be in the past. Please choose a future time."
                minutes_later = int(time_diff)
                minute_label = "minute" if minutes_later == 1 else "minutes"
                return False, (
                    f"Start time must be at least {MIN_FUTURE_TIME_MINUTES} minutes after your create request. "
                    f"Please choose a time at least {minutes_later} {minute_label} later."
                )

            max_future_days = 365
            max_allowed_time = now + timedelta(days=max_future_days)
            if start_dt > max_allowed_time:
                return False, f"Start time cannot be more than {max_future_days} days in the future."

        except ValueError as e:
            return False, f"Invalid datetime format: {str(e)}"
    
    return True, ""


def format_datetime_for_display(datetime_str: str) -> str:
    """Format datetime for user-friendly display"""
    try:
        dt = parse_datetime(datetime_str)
        return dt.strftime("%B %d, %Y at %I:%M %p")
    except Exception:
        return datetime_str