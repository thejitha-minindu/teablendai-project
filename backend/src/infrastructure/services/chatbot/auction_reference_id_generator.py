"""
Custom Auction Reference ID Generator

Format:
    [SellerName][TeaGrade][Origin][5-digit-random]

Example:
    TeaBlendSellerOPKandy12345
"""

from __future__ import annotations

import re
import secrets


def _normalize_seller_name(value: str) -> str:
    words = re.findall(r"[A-Za-z0-9]+", value or "")
    if not words:
        return "Seller"
    return "".join(word[:1].upper() + word[1:] for word in words)


def _normalize_grade(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]", "", value or "")
    return cleaned.upper() if cleaned else "TEA"


def _normalize_origin(value: str) -> str:
    words = re.findall(r"[A-Za-z0-9]+", value or "")
    if not words:
        return "Origin"
    return "".join(word[:1].upper() + word[1:] for word in words)


def generate_five_digit_suffix() -> str:
    return f"{secrets.randbelow(100000):05d}"


def build_auction_reference_id(seller_name: str, tea_grade: str, origin: str) -> str:
    seller = _normalize_seller_name(seller_name)
    grade = _normalize_grade(tea_grade)
    origin_part = _normalize_origin(origin)
    suffix = generate_five_digit_suffix()
    return f"{seller}{grade}{origin_part}{suffix}"
