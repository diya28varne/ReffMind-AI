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
| 1 | Open Hand of God incident | Opening quote + **Read to me** |
| 2 | Vote **YES** or **NO** | Vote screen, progress bar |
| 3 | Scroll reveal | Fan split → **Why arguments last** (4 reasons) |
| 4 | Four perspectives | fan / rule / ref / camera tabs |
| 5 | **What the camera missed** | OG scene + **Watch OG clip ↗** |
| 6 | **Guardian audit** | Second-pass number checks |
| 7 | **Ask the Ref** | Incident-specific prompt chips |
| 8 | Final verdict | Confidence meter + transparency quote |
| 9 | (Optional) **Bring your own controversy** | On first vote screen |

---

## Demo URLs (one per incident)

| Incident | URL |
|----------|-----|
| **Hand of God (best for pitch)** | http://localhost:5173/?demo=wc1986-hand-of-god |
| Montiel handball | http://localhost:5173/?demo=wc2022-montiel-handball |
| Suárez goal-line | http://localhost:5173/?demo=wc2010-suarez-handball |
| Sterling penalty | http://localhost:5173/?demo=euro2020-england-penalty |
| Lautaro offside | http://localhost:5173/?demo=wc2022-saudi-offside |
| Llorente → Moura | http://localhost:5173/?demo=ucl-2019-llorente-handball |

---

## Screenshots to capture

Save PNG files in [`screenshots/`](screenshots/) with these names for a complete submission pack:

| File | Screen |
|------|--------|
| `01-vote-screen.png` | Hand of God vote screen + opening quote + YES/NO |
| `02-fan-split.png` | Fan percentage reveal after voting |
| `03-why-arguments-last.png` | **Star shot** — four-reason disagreement engine |
| `04-perspectives.png` | Four-tab perspective switch (rule or ref tab) |
| `05-camera-missed.png` | What the camera missed + OG scene panel |
| `06-guardian-audit.png` | Guardian audit — all numbers verified |
| `07-ask-the-ref.png` | Ask the Ref expanded with Hand of God prompts |
| `08-final-verdict.png` | Final verdict + confidence + transparency note |
| `09-byo-controversy.png` | Bring your own controversy (first vote screen) |

### How to capture

1. Open **http://localhost:5173/?demo=wc1986-hand-of-god** at 1280×720 or full screen
2. Use **Win + Shift + S** (Windows) or browser DevTools → Capture node screenshot
3. Save into `refmind/docs/screenshots/`
4. Priority for judges: `03-why-arguments-last.png`, `06-guardian-audit.png`, `09-byo-controversy.png`

---

## 90-second pitch

See [`DEMO_SCRIPT.md`](../DEMO_SCRIPT.md) for the full judge script (**Hand of God**).

**One-liner:** *"RefMind doesn't end the argument. It shows you why the argument exists."*

**Pitch beat (memorize):**
1. Hook — Hand of God, opposite national truths
2. Vote — commit before spoilers
3. Engine — rule & truth ruled out; sightline + sides remain
4. Guardian — every number checked so Granite cannot invent one
5. Close — disagreement engine, not another who-was-right AI

---

## Judge Q&A

| Question | Answer |
|----------|--------|
| Which IBM tools? | **Granite** (reasoning), **Docling** (IFAB PDF), **LangChain + Chroma** (RAG) |
| Without API keys? | Yes — `DEMO_MODE=true` runs full UI with structured fallbacks |
| Real VAR data? | No — we reason from IFAB rules + incident context; we're transparent about that |
| Why four reasons? | Isolates which disagreement causes are still alive — the OFFSIDE-style engine |
| Why Guardian audit? | Second pass verifies fan %, decision time, confidence, and IFAB citation |
| Why vote first? | Reduces hindsight bias; makes disagreement emotional before explanations |
| BYO controversy? | Paste facts + two quotes → live four-reason decomposition |

---

## Backend health check

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
Invoke-RestMethod http://127.0.0.1:8001/incidents
```

Expected: `"status": "ok"` and list of **6** incidents (Hand of God first).
