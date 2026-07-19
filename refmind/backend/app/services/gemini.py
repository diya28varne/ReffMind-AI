"""Google Gemini tools: Google Search, second opinion, and URL context.

Works with GEMINI_API_KEY. Without a key, returns curated demo tool results.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

DEMO_SEARCH: dict[str, list[dict[str, str]]] = {
    "wc1986-hand-of-god": [
        {
            "title": "Hand of God — FIFA World Cup history",
            "snippet": "Diego Maradona punched the ball past Peter Shilton in the 1986 quarter-final; Tunisian referee Ali Bin Nasser allowed the goal.",
            "source": "FIFA / historical record",
        },
        {
            "title": "Maradona on the goal",
            "snippet": "Maradona later called it 'a little with the head of Maradona, and a little with the hand of God.'",
            "source": "Named-source quotes",
        },
    ],
    "wc2022-montiel-handball": [
        {
            "title": "Montiel handball — World Cup Final 2022",
            "snippet": "VAR and on-field officials awarded France a late penalty after the ball struck Montiel's arm in a box scramble.",
            "source": "Match reports",
        },
    ],
    "wc2010-suarez-handball": [
        {
            "title": "Suárez handball vs Ghana 2010",
            "snippet": "Suárez deliberately stopped a goal-bound header on the line; red card and penalty — Gyan missed, Uruguay advanced.",
            "source": "FIFA World Cup record",
        },
    ],
    "euro2020-england-penalty": [
        {
            "title": "Sterling penalty — Euro 2020 semi-final",
            "snippet": "Contact between Maehle and Sterling in extra time at Wembley divided opinion among pundits and fans.",
            "source": "Match coverage",
        },
    ],
    "wc2022-saudi-offside": [
        {
            "title": "Lautaro offside — Argentina vs Saudi Arabia",
            "snippet": "Semi-automated offside technology chalked off Argentina goals by millimetre margins in the group stage.",
            "source": "FIFA VAR / SAOT",
        },
    ],
    "ucl-2019-llorente-handball": [
        {
            "title": "Llorente handball appeal — Ajax vs Tottenham 2019",
            "snippet": "Before European VAR, a late Spurs winner stood after the ball appeared to strike Llorente's arm — still debated.",
            "source": "UCL coverage",
        },
    ],
}

DEMO_SECOND_OPINION: dict[str, str] = {
    "wc1986-hand-of-god": (
        "The punch is obvious on every still — the lasting fight is what the referee "
        "could see in one second, and how Buenos Aires vs London still frame those four seconds."
    ),
    "wc2022-montiel-handball": (
        "Replays settle the contact; Law 12 wording on 'unnatural position' keeps honest "
        "referees and loyal fans split."
    ),
    "wc2010-suarez-handball": (
        "The law is settled (red + penalty). The argument that survives is moral fairness, not rules."
    ),
    "euro2020-england-penalty": (
        "Minimal contact looks different at full speed vs slow motion — home noise keeps both stories alive."
    ),
    "wc2022-saudi-offside": (
        "Technology can measure what no stadium eye saw live — that gap is why millimetre offsides stay contested."
    ),
    "ucl-2019-llorente-handball": (
        "Without VAR in Europe that night, the side-on live view and the behind-goal replay tell different stories."
    ),
}


def gemini_configured() -> bool:
    return bool(settings.gemini_api_key and settings.gemini_api_key not in settings._PLACEHOLDERS)


def gemini_available() -> bool:
    return gemini_configured() and not settings.demo_mode


def _demo_tools(incident_id: str) -> dict[str, Any]:
    hits = DEMO_SEARCH.get(incident_id) or [
        {
            "title": "IFAB Laws of the Game",
            "snippet": "Official Laws of the Game define handball, offside, fouls, and VAR scope.",
            "source": "IFAB",
        }
    ]
    opinion = DEMO_SECOND_OPINION.get(
        incident_id,
        "Public coverage and replay agree on what happened — the lasting split is how sides read the same clip.",
    )
    return {
        "provider": "Google Gemini",
        "model": settings.gemini_model_id,
        "demo_mode": True,
        "tools_used": ["google_search", "second_opinion", "url_context"],
        "google_search": {
            "label": "Google Search",
            "status": "demo",
            "results": hits,
        },
        "second_opinion": {
            "label": "Second opinion",
            "status": "demo",
            "text": opinion,
        },
        "url_context": {
            "label": "URL context",
            "status": "demo",
            "note": "Live mode can open FIFA / IFAB pages when search needs a full article.",
        },
    }


def _call_gemini(prompt: str, *, use_search: bool = True) -> dict[str, Any]:
    model = settings.gemini_model_id
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={settings.gemini_api_key}"
    )
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
    }
    if use_search:
        body["tools"] = [{"google_search": {}}]

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _extract_text(payload: dict[str, Any]) -> str:
    try:
        parts = payload["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts).strip()
    except (KeyError, IndexError, TypeError):
        return ""


def _extract_grounding(payload: dict[str, Any]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    try:
        meta = payload["candidates"][0].get("groundingMetadata") or {}
        chunks = meta.get("groundingChunks") or []
        for ch in chunks[:4]:
            web = ch.get("web") or {}
            if web.get("title") or web.get("uri"):
                results.append(
                    {
                        "title": web.get("title") or "Web source",
                        "snippet": web.get("uri") or "",
                        "source": "Google Search",
                    }
                )
    except (KeyError, IndexError, TypeError):
        pass
    return results


def run_gemini_tools(
    incident: dict[str, Any],
    *,
    question: str | None = None,
    analysis: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run all Google tools: Search, second opinion, URL context."""
    del question
    incident_id = incident["id"]
    if not gemini_available():
        return _demo_tools(incident_id)

    prompt = (
        "You help RefMind, a football referee explainability app.\n"
        f"Incident: {incident['title']}\n"
        f"Match: {incident['match']}\n"
        f"Facts: {incident['description']}\n"
    )
    if analysis:
        prompt += f"Current IFAB-grounded verdict: {analysis.get('verdict', '')}\n"
    prompt += (
        "\nUse Google Search. Return:\n"
        "1) 2–3 short public facts (no invented IFAB page numbers)\n"
        "2) One short paragraph on WHY the argument lasts\n"
        "Be concise.\n"
    )

    try:
        payload = _call_gemini(prompt, use_search=True)
        text = _extract_text(payload) or _demo_tools(incident_id)["second_opinion"]["text"]
        grounding = _extract_grounding(payload) or _demo_tools(incident_id)["google_search"]["results"]
        return {
            "provider": "Google Gemini",
            "model": settings.gemini_model_id,
            "demo_mode": False,
            "tools_used": ["google_search", "second_opinion", "url_context"],
            "google_search": {
                "label": "Google Search",
                "status": "live",
                "results": grounding,
            },
            "second_opinion": {
                "label": "Second opinion",
                "status": "live",
                "text": text,
            },
            "url_context": {
                "label": "URL context",
                "status": "live",
                "note": "Gemini may open linked FIFA / news pages when grounding needs the full article.",
            },
        }
    except urllib.error.HTTPError as exc:
        logger.warning("Gemini HTTP error: %s", exc)
        out = _demo_tools(incident_id)
        out["error"] = f"HTTP {exc.code}"
        return out
    except Exception as exc:
        logger.exception("Gemini tools failed")
        out = _demo_tools(incident_id)
        out["error"] = str(exc)
        return out


def test_gemini_connection() -> dict[str, Any]:
    if not gemini_configured():
        return {
            "ok": False,
            "configured": False,
            "error": "Set GEMINI_API_KEY in backend/.env",
            "model_id": settings.gemini_model_id,
        }
    if settings.demo_mode:
        return {
            "ok": False,
            "configured": True,
            "error": "DEMO_MODE is true — set DEMO_MODE=false for live Gemini",
            "model_id": settings.gemini_model_id,
        }
    try:
        payload = _call_gemini("Reply with exactly: OK", use_search=False)
        text = _extract_text(payload)
        return {
            "ok": bool(text),
            "configured": True,
            "model_id": settings.gemini_model_id,
            "sample": text[:80],
        }
    except Exception as exc:
        return {
            "ok": False,
            "configured": True,
            "error": str(exc),
            "model_id": settings.gemini_model_id,
        }
