"""Bring-your-own controversy — decompose a custom dispute into four reasons."""

from __future__ import annotations

from typing import Any


def _keyword_hits(text: str, words: tuple[str, ...]) -> bool:
    lower = text.lower()
    return any(w in lower for w in words)


def analyze_custom_controversy(facts: str, side_a: str, side_b: str) -> dict[str, Any]:
    """
    Heuristic four-factor breakdown for user-submitted controversies.
    Works offline in demo mode; highlights which disagreement reasons stay live.
    """
    blob = f"{facts}\n{side_a}\n{side_b}"

    rule_unclear = _keyword_hits(
        blob,
        ("borderline", "unclear", "interpretation", "wording", "grey", "gray", "debatable"),
    ) or _keyword_hits(blob, ("handball", "offside", "foul", "penalty"))

    truth_unknowable = _keyword_hits(
        blob,
        ("not sure", "unclear", "maybe", "replay", "angle", "couldn't see", "could not see", "dispute"),
    )

    referee_sightline = _keyword_hits(
        blob,
        ("referee", "ref ", "sightline", "blocked", "screened", "behind", "angle", "var", "slow"),
    ) or True  # default live — custom cases almost always have a sightline problem

    sides_want = bool(side_a.strip() and side_b.strip())

    # Soften rule_unclear when both quotes are moral rather than legal
    if _keyword_hits(blob, ("cheat", "destiny", "robbed", "justice", "unfair")) and not _keyword_hits(
        blob, ("law", "rule", "ifab", "handball", "offside")
    ):
        rule_unclear = False

    factors = [
        {
            "id": "rule_unclear",
            "label": "Is the rule unclear?",
            "active": rule_unclear,
            "verdict": "Live reason" if rule_unclear else "Ruled out",
            "detail": (
                "Opposing readings of the same law language keep the fight open."
                if rule_unclear
                else "Both sides are arguing past the rulebook — the law itself is not the bottleneck."
            ),
        },
        {
            "id": "truth_unknowable",
            "label": "Is the truth unknowable?",
            "active": truth_unknowable,
            "verdict": "Live reason" if truth_unknowable else "Ruled out",
            "detail": (
                "Key facts still depend on angle, frame, or incomplete evidence."
                if truth_unknowable
                else "The factual picture is settled enough — disagreement is about meaning, not pixels."
            ),
        },
        {
            "id": "referee_sightline",
            "label": "Could the referee see it in time?",
            "active": referee_sightline,
            "verdict": "Live reason" if referee_sightline else "Ruled out",
            "detail": (
                "Live sightline, decision window, or technology gap is still part of the room's split."
                if referee_sightline
                else "Everyone agrees the referee had a clear view in time."
            ),
        },
        {
            "id": "sides_want",
            "label": "Do the sides just want their own way?",
            "active": sides_want,
            "verdict": "Live reason" if sides_want else "Ruled out",
            "detail": (
                f'Side A: "{side_a.strip()}" — Side B: "{side_b.strip()}" — same facts, opposite desired endings.'
                if sides_want
                else "No clear tribal split was supplied."
            ),
        },
    ]

    live = [f for f in factors if f["active"]]
    ruled = [f for f in factors if not f["active"]]

    return {
        "summary": (
            f"RefMind ruled out {len(ruled)} reason(s) and left {len(live)} live. "
            "It does not end the argument — it shows why the argument exists."
        ),
        "argument_anatomy": {
            "headline": "Your controversy, decomposed.",
            "closing": (
                "What's left is the real argument."
                if live
                else "Unusual — every classic disagreement reason was ruled out."
            ),
            "factors": factors,
        },
        "demo_mode": True,
    }
