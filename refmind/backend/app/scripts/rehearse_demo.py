"""Rehearse the 90-second Montiel handball demo against the live API."""

from __future__ import annotations

import json
import sys
import urllib.request

INCIDENT_ID = "wc1986-hand-of-god"
BASE = "http://127.0.0.1:8001"


def get_incident() -> dict:
    return json.loads(urllib.request.urlopen(f"{BASE}/incidents/{INCIDENT_ID}").read())


def post_analyze(user_vote: bool) -> dict:
    req = urllib.request.Request(
        f"{BASE}/incidents/{INCIDENT_ID}/analyze",
        data=json.dumps({"user_vote": user_vote}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    return json.loads(urllib.request.urlopen(req, timeout=60).read())


def main() -> int:
    print("=" * 60)
    print("RefMind — 90-SECOND DEMO REHEARSAL")
    print("Incident: Montiel handball, World Cup Final 2022")
    print("=" * 60)

    try:
        health = json.loads(urllib.request.urlopen(f"{BASE}/health").read())
    except Exception as exc:
        print(f"\nAPI not reachable at {BASE} — start backend first.\n  {exc}")
        return 1

    print(f"\nBackend: granite_live={health.get('granite_live')}, demo_mode={health.get('demo_mode')}\n")

    incident = get_incident()
    result = post_analyze(user_vote=True)

    steps = [
        ("0:00", "HOOK", "Everyone remember the handball in the World Cup final?"),
        ("0:10", "VOTE", f"{incident['question']}\n       -> User taps YES or NO on screen"),
        ("0:20", "FAN %", f"{result['fan_yes_pct']}% said YES. You voted YES. "
                 f"{'You agreed with most fans.' if result['agreed_with_majority'] else 'You disagreed with most fans.'}"),
        ("0:35", "RULE", result["rule_explanation"]),
        ("0:50", "REF", result["referee_perspective"]),
        ("1:05", "CAMERA", result["camera_analysis"]),
        ("1:20", "VERDICT", f"{result['verdict']} (confidence: {result['confidence']})\n"
                  f"       {result['verdict_reasoning']}"),
    ]

    for time, label, text in steps:
        print(f"[{time}] {label}")
        print(f"  {text}\n")

    print("=" * 60)
    print(f"Rules grounded in: {', '.join(result.get('rules_used', []))}")
    if result.get("demo_mode"):
        print("NOTE: Running demo fallback — add watsonx keys for live Granite.")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
