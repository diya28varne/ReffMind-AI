"""Emotion vs rule labels and dynamic meter values."""

from __future__ import annotations

from typing import Any

# Labels only — percentages are computed at analysis time from fan votes + AI confidence.
EMOTION_RULE_LABELS: dict[str, dict[str, str]] = {
    "wc1986-hand-of-god": {
        "emotion_label": "CHEATING",
        "rule_label": "CLEAR HANDBALL — Law 12",
    },
    "wc2022-montiel-handball": {
        "emotion_label": "HAND BALL",
        "rule_label": "BORDERLINE — Law 12",
    },
    "wc2010-suarez-handball": {
        "emotion_label": "CHEATING",
        "rule_label": "CORRECT RED CARD",
    },
    "euro2020-england-penalty": {
        "emotion_label": "PENALTY",
        "rule_label": "NO FOUL — PLAY ON",
    },
    "wc2022-saudi-offside": {
        "emotion_label": "OFFSIDE",
        "rule_label": "MARGINAL VAR CALL",
    },
    "ucl-2019-llorente-handball": {
        "emotion_label": "HAND BALL",
        "rule_label": "GOAL STANDS",
    },
}

DEFAULT_LABELS = {
    "emotion_label": "FOUL",
    "rule_label": "DEBATABLE",
}


def _clamp_pct(value: int | float) -> int:
    return max(0, min(100, int(round(value))))


def get_emotion_rule_labels(incident: dict[str, Any]) -> dict[str, str]:
    """Return display labels for the emotion vs rule cards."""
    custom = incident.get("emotion_rule") or {}
    if custom.get("emotion_label") and custom.get("rule_label"):
        return {
            "emotion_label": custom["emotion_label"],
            "rule_label": custom["rule_label"],
        }
    return EMOTION_RULE_LABELS.get(incident["id"], DEFAULT_LABELS)


def get_emotion_rule(incident: dict[str, Any]) -> dict[str, Any]:
    """Legacy helper — labels with placeholder percentages (prefer build_dynamic_emotion_rule)."""
    labels = get_emotion_rule_labels(incident)
    yes = incident.get("fan_yes_pct", 50)
    return {
        **labels,
        "emotion_pct": _clamp_pct(yes),
        "rule_pct": 63,
    }


def build_dynamic_emotion_rule(
    incident: dict[str, Any],
    *,
    fan_yes_pct: int,
    confidence_pct: int,
    verdict: str | None = None,
) -> dict[str, Any]:
    """
    Build emotion vs rule meter from live analysis data.

    - emotion_pct: share of fans who voted yes (foul / penalty / offside, etc.)
    - rule_pct: AI confidence in the rule-based verdict (0–100)
    """
    labels = get_emotion_rule_labels(incident)
    return {
        **labels,
        "emotion_pct": _clamp_pct(fan_yes_pct),
        "rule_pct": _clamp_pct(confidence_pct),
        "emotion_basis": "fan_yes_pct",
        "rule_basis": "ai_confidence",
        "verdict": verdict,
    }
