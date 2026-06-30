# RefMind — 90-Second Demo Script

**Incident:** Montiel handball — Argentina vs France, World Cup Final 2022  
**Open URL:** http://localhost:5173/?demo=wc2022-montiel-handball

**Tagline:** *"Don't just watch the match. Understand the moment."*

---

## Before you start

```powershell
# Terminal 1 — backend
cd refmind\backend
.\venv\Scripts\uvicorn app.main:app --reload --port 8001

# Terminal 2 — frontend
cd refmind\frontend
npm run dev

# Rehearse in terminal (optional)
cd refmind\backend
.\venv\Scripts\python -m app.scripts.rehearse_demo
```

---

## The script (90 seconds)

### [0:00] HOOK — 10 sec

> *"Everyone remember this handball in the World Cup final? Argentina leading 3-2 in extra time. France cross into the box. The ball hits Montiel's arm. Penalty. Mbappé scores. 3-3."*

**Action:** Show the voting screen. Don't reveal anything yet.

---

### [0:10] VOTE — 10 sec

> *"You have five seconds — was it a handball? Vote now."*

**Action:** Click **YES** or **NO** on screen. Pause. Let the audience commit.

---

### [0:20] FAN SPLIT — 15 sec

> *"58% of fans said yes — handball. You agreed with most people."*  
> *(Or: "You disagreed with most people" if you voted NO.)*

**Action:** Fan bar animates on screen. Point at the split.

---

### [0:35] THE RULE — 15 sec

> *"Here's what the referee actually saw — and why the rule says something different from what you think."*

**Read from screen — Rule section:**

> IFAB Law 12 — not every arm contact is handball. The arm must be in an unnaturally extended position or move toward the ball. On this incident, that's genuinely borderline.

**Action:** Point to *"Grounded in: IFAB …"* footer — rules come from official PDF via Docling, not made up.

---

### [0:50] REFEREE VIEW — 15 sec

> *"The referee was 12 metres inside the box, front-on to Montiel. He had about 2 seconds. World Cup final. Extra time. He saw arm contact in a scramble — not whether the arm moved toward the ball."*

**Action:** RefMind card — **What the referee saw**

---

### [1:05] CAMERA + LIE DETECTOR — 20 sec

> *"Here's what the broadcast camera physically couldn't show you."*

**Action:** Camera hid card appears, then **Camera lie detector** — ask audience to tap *Keep my vote* or *Change my vote*.

> *"51% of users flip after seeing what the camera hid. Did the replay lie to you?"*

---

### [1:15] TWO REFS — 10 sec

> *"Two professional referees. Two honest calls. Both defensible."*

**Action:** Split verdict cards — Ref A says penalty, Ref B says play on.

---

### [1:25] VERDICT — 5 sec

> *"Our verdict: Defensible but debatable. Confidence: medium."*

> *"Two professional referees could disagree here — and that's exactly why millions of fans argue. RefMind doesn't tell you what to think. It shows you what you couldn't see."*

**Action:** Verdict card on screen. Pause. End.

---

## One-liner close

> *"RefMind — don't just watch the match. Understand the moment."*

---

## Judge Q&A prep

| Question | Answer |
|----------|--------|
| Why Granite? | Honest reasoning + uncertainty in verdict labels |
| Why Docling? | IFAB PDF ingested — explanations grounded in official rules |
| Why vote first? | Stops hindsight bias; makes disagreement emotional |
| What camera hid? | Structured context sent to Granite — no computer vision needed |

---

## Backup if API fails

Run `python -m app.scripts.rehearse_demo` — demo fallback still works without watsonx keys.
