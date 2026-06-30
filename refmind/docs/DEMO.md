# RefMind — Demo & Screenshot Guide

Use this guide for judge demos and submission screenshots.

---

## Run the demo

```powershell
cd refmind\scripts
start-demo.cmd
```

Or manually: backend on **8001**, frontend on **5173** (see main [README](../README.md)).

---

## Recommended demo flow (3–5 minutes)

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Open Montiel incident | Opening quote + **Read to me** |
| 2 | Vote **YES** or **NO** | Vote screen, progress bar |
| 3 | Scroll reveal | Fan split → four perspective tabs |
| 4 | **What the camera missed** | OG scene image + **Watch OG clip ↗** |
| 5 | **Ask the Ref** | Incident-specific prompt chips |
| 6 | Final verdict | Confidence meter + transparency quote |
| 7 | **Next incident** | Progress bar advances |

---

## Demo URLs (one per incident)

| Incident | URL |
|----------|-----|
| Montiel handball (best for pitch) | http://localhost:5173/?demo=wc2022-montiel-handball |
| Suárez goal-line | http://localhost:5173/?demo=wc2010-suarez-handball |
| Sterling penalty | http://localhost:5173/?demo=euro2020-england-penalty |
| Lautaro offside | http://localhost:5173/?demo=wc2022-saudi-offside |
| Llorente → Moura | http://localhost:5173/?demo=ucl-2019-llorente-handball |

---

## Screenshots to capture

Save PNG files in [`screenshots/`](screenshots/) with these names for a complete submission pack:

| File | Screen |
|------|--------|
| `01-vote-screen.png` | Vote screen with opening quote + YES/NO |
| `02-fan-split.png` | Fan percentage reveal after voting |
| `03-perspectives.png` | Four-tab perspective switch (rule or ref tab) |
| `04-camera-missed.png` | What the camera missed + OG scene panel |
| `05-ask-the-ref.png` | Ask the Ref expanded with incident prompts |
| `06-final-verdict.png` | Final verdict + confidence + transparency note |
| `07-future-scope.png` | Future scope panel (first incident vote screen only) |

### How to capture

1. Run the demo locally at 1280×720 or full screen
2. Use **Win + Shift + S** (Windows) or browser devtools screenshot
3. Save into `refmind/docs/screenshots/`
4. Reference them in your pitch deck or `RESULTS.md`

---

## 90-second pitch

See [`DEMO_SCRIPT.md`](../DEMO_SCRIPT.md) for the full judge script (Montiel handball).

**One-liner:** *"RefMind — don't just watch the match. Understand the moment."*

---

## Judge Q&A

| Question | Answer |
|----------|--------|
| Which IBM tools? | **Granite** (reasoning), **Docling** (IFAB PDF), **LangChain + Chroma** (RAG) |
| Without API keys? | Yes — `DEMO_MODE=true` runs full UI with structured fallbacks |
| Real VAR data? | No — we reason from IFAB rules + incident context; we're transparent about that |
| Why vote first? | Reduces hindsight bias; makes disagreement emotional before explanations |
| Scalable? | Future scope panel shows live-match analysis roadmap |

---

## Backend health check

```powershell
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8001/incidents
```

Expected: `"status": "ok"` and list of 5 incidents.
