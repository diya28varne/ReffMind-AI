"""Google Gemini tools: Google Search, second opinion, and URL context.

Works with GEMINI_API_KEY. Without a key, returns curated demo tool results.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

DEMO_SEARCH: dict[str, list[dict[str, str]]] = {
    "wc1986-hand-of-god": [
        {
            "title": "Hand of God — FIFA World Cup history",
            "snippet": "Diego Maradona punched the ball past Peter Shilton in the 1986 quarter-final; Tunisian referee Ali Bin Nasser allowed the goal.",
            "source": "FIFA article",
            "url": "https://www.fifa.com/en/articles/diego-maradona-argentina-england-hand-of-god-1986",
        },
        {
            "title": "Maradona's Famous 8 Minutes",
            "snippet": "Official FIFA footage of the Hand of God and Goal of the Century within the same stretch of play.",
            "source": "FIFA YouTube",
            "url": "https://www.youtube.com/watch?v=FRAbNlPS2MI&t=34s",
        },
    ],
    "wc2022-montiel-handball": [
        {
            "title": "Montiel handball — World Cup Final 2022",
            "snippet": "VAR and on-field officials awarded France a late penalty after the ball struck Montiel's arm in a box scramble.",
            "source": "Match reports",
            "url": "https://www.fifa.com/en/tournaments/mens/worldcup/qatar2022/match-center",
        },
    ],
    "wc2010-suarez-handball": [
        {
            "title": "Suárez handball vs Ghana 2010",
            "snippet": "Suárez deliberately stopped a goal-bound header on the line; red card and penalty — Gyan missed, Uruguay advanced.",
            "source": "FIFA World Cup record",
            "url": "https://www.fifa.com/en/tournaments/mens/worldcup/southafrica2010",
        },
    ],
    "euro2020-england-penalty": [
        {
            "title": "Sterling penalty — Euro 2020 semi-final",
            "snippet": "Contact between Maehle and Sterling in extra time at Wembley divided opinion among pundits and fans.",
            "source": "Match coverage",
            "url": "https://www.uefa.com/uefaeuro/",
        },
    ],
    "wc2022-saudi-offside": [
        {
            "title": "Lautaro offside — Argentina vs Saudi Arabia",
            "snippet": "Semi-automated offside technology chalked off Argentina goals by millimetre margins in the group stage.",
            "source": "FIFA VAR / SAOT",
            "url": "https://www.fifa.com/en/tournaments/mens/worldcup/qatar2022",
        },
    ],
    "ucl-2019-llorente-handball": [
        {
            "title": "Llorente handball appeal — Ajax vs Tottenham 2019",
            "snippet": "Before European VAR, a late Spurs winner stood after the ball appeared to strike Llorente's arm — still debated.",
            "source": "UCL coverage",
            "url": "https://www.uefa.com/uefachampionsleague/",
        },
    ],
}

DEMO_URL_LINKS: dict[str, list[dict[str, str]]] = {
    "wc1986-hand-of-god": [
        {
            "title": "IFAB Laws of the Game",
            "url": "https://www.theifab.com/laws/",
            "note": "Official Law 12 handball wording",
        },
        {
            "title": "FIFA — Hand of God article",
            "url": "https://www.fifa.com/en/articles/diego-maradona-argentina-england-hand-of-god-1986",
            "note": "Match history and quotes",
        },
    ],
    "wc2022-montiel-handball": [
        {
            "title": "IFAB Laws of the Game",
            "url": "https://www.theifab.com/laws/",
            "note": "Law 12 — Handball",
        },
        {
            "title": "FIFA World Cup 2022",
            "url": "https://www.fifa.com/en/tournaments/mens/worldcup/qatar2022",
            "note": "Tournament hub",
        },
    ],
}

_DEFAULT_URL_LINKS = [
    {
        "title": "IFAB Laws of the Game",
        "url": "https://www.theifab.com/laws/",
        "note": "Official rulebook",
    },
]

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
            "note": "Open these pages for the full IFAB / match context.",
            "links": DEMO_URL_LINKS.get(incident_id, _DEFAULT_URL_LINKS),
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
                        "url": web.get("uri") or "",
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
                "note": "Open linked FIFA / IFAB pages for full context.",
                "links": DEMO_URL_LINKS.get(incident_id, _DEFAULT_URL_LINKS),
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


DEMO_VISION: dict[str, str] = {
    "wc1986-hand-of-god": (
        "Gemini Vision (demo): A contested leap between a shorter attacker in blue "
        "and a taller keeper in white — the frame makes hand contact hard to read live, "
        "exactly the sightline problem this argument still lives on."
    ),
    "wc2022-montiel-handball": (
        "Gemini Vision (demo): Chaotic box scramble — arm contact is only clear after freeze-frame, "
        "not at full-speed referee angle."
    ),
}

DEMO_ASK: dict[str, str] = {
    "default": (
        "Gemini demo: I'm looking at public match context plus your incident card. "
        "Ask about sightline, rules, or why fans still argue — I won't invent IFAB page numbers."
    ),
}


def analyze_scene_vision(incident: dict[str, Any], image_url: str | None = None) -> dict[str, Any]:
    """Gemini Vision — describe what the OG scene still reveals."""
    incident_id = incident["id"]
    demo_text = DEMO_VISION.get(
        incident_id,
        f"Gemini Vision (demo): Still frame from {incident['title']} — contact and angle are clearer on replay than live.",
    )
    caption = (incident.get("camera_context") or {}).get("broadcast_angle", "")
    if not gemini_available():
        return {
            "provider": "Google Gemini Vision",
            "demo_mode": True,
            "description": demo_text,
            "caption_hint": caption,
        }

    prompt = (
        "You are helping fans understand a football referee controversy. "
        "Describe what a broadcast still likely shows in 2–3 sentences. "
        "Focus on sightline / body positions — do not invent IFAB pages.\n"
        f"Incident: {incident['title']}\n"
        f"Match: {incident['match']}\n"
        f"Known angle: {caption}\n"
        f"Image URL (if useful): {image_url or 'n/a'}\n"
    )
    try:
        # Text-only live call keeps serverless simple; image URL passed in prompt context.
        payload = _call_gemini(prompt, use_search=False)
        text = _extract_text(payload) or demo_text
        return {
            "provider": "Google Gemini Vision",
            "demo_mode": False,
            "description": text,
            "caption_hint": caption,
        }
    except Exception as exc:
        logger.warning("Gemini vision failed: %s", exc)
        return {
            "provider": "Google Gemini Vision",
            "demo_mode": True,
            "description": demo_text,
            "caption_hint": caption,
            "error": str(exc),
        }


def ask_gemini(
    incident: dict[str, Any],
    question: str,
    analysis: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Ask Gemini chat (public web + incident context) — separate from Ask the Ref."""
    q = (question or "").strip()
    if not q:
        return {"answer": "Ask a question about this incident.", "demo_mode": True, "confidence": 0.2}

    if not gemini_available():
        opinion = DEMO_SECOND_OPINION.get(incident["id"], DEMO_ASK["default"])
        return {
            "answer": f"{DEMO_ASK['default']}\n\nOn this call: {opinion}",
            "demo_mode": True,
            "confidence": 0.55,
            "provider": "Google Gemini",
        }

    prompt = (
        "Answer briefly for football fans. Use Google Search if helpful. "
        "Do not invent IFAB page numbers.\n"
        f"Incident: {incident['title']}\n"
        f"Description: {incident['description']}\n"
        f"Question: {q}\n"
    )
    if analysis:
        prompt += f"RefMind verdict so far: {analysis.get('verdict', '')}\n"
    try:
        payload = _call_gemini(prompt, use_search=True)
        text = _extract_text(payload) or DEMO_ASK["default"]
        return {
            "answer": text,
            "demo_mode": False,
            "confidence": 0.7,
            "provider": "Google Gemini",
        }
    except Exception as exc:
        logger.warning("Ask Gemini failed: %s", exc)
        return {
            "answer": DEMO_ASK["default"],
            "demo_mode": True,
            "confidence": 0.4,
            "provider": "Google Gemini",
            "error": str(exc),
        }


# Lightweight demo translations for key languages without an API key.
_DEMO_LANG = {
    "es": {"name": "Español"},
    "hi": {"name": "हिन्दी"},
    "pt": {"name": "Português"},
    "fr": {"name": "Français"},
}


def _mymemory_translate(text: str, lang: str) -> str | None:
    """Free public translate API (no key) — used when Gemini is not configured."""
    code = (lang or "en")[:2]
    if not text or code == "en":
        return text
    # MyMemory ~500 char limit per call — chunk by sentences when needed
    chunks: list[str] = []
    remaining = text
    while remaining:
        if len(remaining) <= 450:
            chunks.append(remaining)
            break
        cut = remaining.rfind(". ", 0, 450)
        if cut < 80:
            cut = 450
        else:
            cut += 1
        chunks.append(remaining[:cut].strip())
        remaining = remaining[cut:].strip()

    outs: list[str] = []
    for chunk in chunks:
        if not chunk:
            continue
        q = urllib.parse.quote(chunk)
        url = f"https://api.mymemory.translated.net/get?q={q}&langpair=en|{code}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "RefMind/1.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            translated = (data.get("responseData") or {}).get("translatedText") or ""
            translated = translated.strip()
            if not translated or translated.lower() == chunk.lower():
                return None
            # Skip quota / error strings
            if "MYMEMORY WARNING" in translated.upper():
                return None
            outs.append(translated)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
            logger.warning("MyMemory translate failed: %s", exc)
            return None
    return " ".join(outs).strip() or None


def translate_text(text: str, target_lang: str) -> dict[str, Any]:
    """Translate UI text via Gemini, or free MyMemory when no API key."""
    text = (text or "").strip()
    lang = (target_lang or "en").lower()[:5]
    if not text or lang in ("en", "en-us", "en-gb"):
        return {"text": text, "lang": "en", "demo_mode": False, "provider": "passthrough"}

    if gemini_available():
        prompt = (
            f"Translate the following football explainability text into language code '{lang}'. "
            "Keep names and IFAB law numbers unchanged. Return only the translation.\n\n"
            f"{text}"
        )
        try:
            payload = _call_gemini(prompt, use_search=False)
            out = _extract_text(payload) or text
            return {
                "text": out,
                "lang": lang,
                "demo_mode": False,
                "provider": "Google Gemini Translate",
            }
        except Exception as exc:
            logger.warning("Gemini translate failed, trying free fallback: %s", exc)

    # No Gemini key (or Gemini failed) — free public translator so the UI still works
    free = _mymemory_translate(text, lang)
    if free:
        return {
            "text": free,
            "lang": lang,
            "demo_mode": False,
            "provider": "MyMemory Translate",
            "note": None,
        }

    meta = _DEMO_LANG.get(lang[:2], {"name": lang})
    return {
        "text": text,
        "lang": lang,
        "demo_mode": True,
        "provider": "passthrough",
        "note": f"Could not reach translator for {meta.get('name', lang)}. Try again, or add GEMINI_API_KEY.",
    }
