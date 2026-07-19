"""OG broadcast scene metadata per incident."""

from __future__ import annotations

from typing import Any

OG_SCENES: dict[str, dict[str, str | int]] = {
    "wc1986-hand-of-god": {
        "label": "OG scene",
        "broadcast": "Live broadcast — trail angle",
        "caption": "Azteca, 51' — Maradona rises with Shilton; the punch is screened from the referee",
        "image": "https://img.youtube.com/vi/5sFcPv62Qlc/hqdefault.jpg",
        "alt": "Argentina vs England, World Cup 1986 — Hand of God",
        "video_id": "5sFcPv62Qlc",
        "video_start": 0,
        "source": "Diego Maradona — Hand of God, World Cup 1986",
    },
    "wc2022-montiel-handball": {
        "label": "OG scene",
        "broadcast": "Live broadcast — full speed",
        "caption": "World Cup final, 116' — chaotic box scramble before Montiel's arm contact",
        "image": "/scenes/wc2022-montiel-handball.jpg",
        "alt": "Argentina vs France, World Cup Final 2022 live match action",
        "video_id": "zhEWqfP6V_w",
        "video_start": 72,
        "source": "FIFA — Argentina v France, World Cup 2022 Final highlights",
    },
    "wc2010-suarez-handball": {
        "label": "OG scene",
        "broadcast": "Live broadcast — goal-line view",
        "caption": "Soccer City, 120' — Suárez stops Adiyiah's header with both hands on the line",
        "image": "/scenes/wc2010-suarez-handball.jpg",
        "alt": "Uruguay vs Ghana, World Cup quarter-final 2010",
        "video_id": "dM-29hy-Qyw",
        "video_start": 56,
        "source": "FIFA — Luis Suárez handball vs Ghana, World Cup 2010",
    },
    "euro2020-england-penalty": {
        "label": "OG scene",
        "broadcast": "Live broadcast — trailing angle",
        "caption": "Wembley extra time, 104' — Sterling goes down as Maehle's leg extends",
        "image": "/scenes/euro2020-england-penalty.jpg",
        "alt": "England vs Denmark, Euro 2020 semi-final at Wembley",
        "video_id": "JV0vUDo8Ujw",
        "video_start": 8,
        "source": "England 2-1 Denmark — Euro 2020 semi-final extra-time highlights",
    },
    "wc2022-saudi-offside": {
        "label": "OG scene",
        "broadcast": "Live broadcast — no VAR lines",
        "caption": "Lusail Stadium, 48' — Lautaro finishes; flag stays down until VAR intervenes",
        "image": "/scenes/wc2022-saudi-offside.jpg",
        "alt": "Argentina vs Saudi Arabia, World Cup 2022 group stage",
        "video_id": "V5xuPXq83D8",
        "video_start": 0,
        "source": "Lautaro Martínez offside vs Saudi Arabia — World Cup 2022",
    },
    "ucl-2019-llorente-handball": {
        "label": "OG scene",
        "broadcast": "Live broadcast — side-on at speed",
        "caption": "Johan Cruyff Arena, 95' — ball comes off Llorente's upper body to Lucas Moura",
        "image": "/scenes/ucl-2019-llorente-handball.jpg",
        "alt": "Ajax vs Tottenham, Champions League semi-final 2019",
        "video_id": "tY5stQvwkBA",
        "video_start": 55,
        "source": "Tottenham — Lucas Moura hat-trick vs Ajax, UCL semi-final 2019",
    },
}

DEFAULT_OG_SCENE: dict[str, str | int] = {
    "label": "OG scene",
    "broadcast": "Live broadcast",
    "caption": "What TV showed at full speed — before slow-motion replays",
    "image": "",
    "alt": "Live football broadcast scene",
    "video_id": "",
    "video_start": 0,
    "source": "",
}


def youtube_clip_url(video_id: str, start_seconds: int = 0) -> str:
    base = f"https://www.youtube.com/watch?v={video_id}"
    if start_seconds > 0:
        return f"{base}&t={start_seconds}s"
    return base


def _with_clip_url(scene: dict[str, str | int]) -> dict[str, str | int]:
    video_id = str(scene.get("video_id") or "")
    if not video_id:
        return scene
    start = int(scene.get("video_start") or 0)
    return {**scene, "video_url": youtube_clip_url(video_id, start)}


def get_og_scene(incident: dict[str, Any]) -> dict[str, str | int]:
    if incident.get("og_scene"):
        return _with_clip_url({**DEFAULT_OG_SCENE, **incident["og_scene"]})
    base = OG_SCENES.get(incident["id"], DEFAULT_OG_SCENE)
    return _with_clip_url(base)
