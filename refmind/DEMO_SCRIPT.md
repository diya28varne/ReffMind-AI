# RefMind — 90-Second Demo Script

**Incident:** Hand of God — Maradona, Argentina vs England, World Cup 1986  
**Open URL:** http://localhost:5173/?demo=wc1986-hand-of-god

**Tagline:** *"Every football AI argues who was right. RefMind answers why the argument never ends."*

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

### [0:00] HOOK — 12 sec

> *"1986. Maradona rises with Shilton and punches the ball in. Buenos Aires called it the greatest goal. London called it cheating. Same four seconds — opposite truths. Forty years later the argument still has not ended."*

**Action:** Show the voting screen. Don't reveal anything yet.

---

### [0:12] VOTE — 8 sec

> *"Should the goal have stood? Vote now."*

**Action:** Click **YES** or **NO** on screen. Pause. Let the audience commit.

---

### [0:20] FAN SPLIT — 10 sec

> *"47% still say the goal should stand — forty years on. The room is split."*

**Action:** Fan bar animates on screen.

---

### [0:30] DISAGREEMENT ENGINE — 20 sec

> *"RefMind doesn't ask who was right. It breaks the argument into four reasons it lasts."*

**Action:** Point at the four cards.

> *"Rule unclear? Ruled out — Law 12 is clear. Truth unknowable? Ruled out — we all saw the hand. What's left: the referee couldn't see it in time, and both sides still want their own story."*

---

### [0:50] CAMERA + GUARDIAN — 20 sec

> *"TV settled the factual truth for history — not for the live call. And every number on this screen is Guardian-checked against the dataset so Granite cannot invent one."*

**Action:** OG clip link + Guardian audit panel.

---

### [1:10] VERDICT — 10 sec

> *"Verdict: Likely wrong. The fist is clear. The live referee was unsighted. RefMind doesn't end the Hand of God argument — it shows why the argument exists."*

**Action:** Verdict card. Pause. End.

---

## One-liner close

> *"RefMind — it doesn't end the argument. It shows you why the argument exists."*

---

## Bonus (if time)

Scroll to **Bring your own controversy** on the vote screen — paste a disputed penalty + two manager quotes and watch the four reasons light up live.

---

## Judge Q&A prep

| Question | Answer |
|----------|--------|
| Why Granite? | Honest reasoning + uncertainty in verdict labels |
| Why Docling? | IFAB PDF ingested — explanations grounded in official rules |
| Why four reasons? | Rules out dead arguments so the live ones stand out |
| Why Guardian audit? | Second pass verifies every cited number against grounded sources |
| Why vote first? | Stops hindsight bias; makes disagreement emotional |

---

## Backup if API fails

Run `python -m app.scripts.rehearse_demo` — demo fallback still works without watsonx keys.
