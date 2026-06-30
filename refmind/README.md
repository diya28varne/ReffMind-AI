# RefMind

> *"You saw what the referee saw. Now understand why you disagreed."*

**Don't just watch the match. Understand the moment.**

RefMind is an AI referee explainability platform built for the **IBM SkillsBuild AI Builders Challenge**. Fans vote on controversial decisions *before* seeing the answer — then get fan splits, IFAB-grounded rule explanations, camera blind-spot analysis, voice narration, and an honest verdict with visible uncertainty.

---

## Submission checklist

| Requirement | Location |
|-------------|----------|
| **Source code** | This folder (`refmind/`) — backend + frontend |
| **README** | `refmind/README.md` (this file) |
| **IBM tools used** | [IBM tools section](#ibm-tools-used) below |
| **Setup instructions** | [Quick start](#quick-start) below |
| **Screenshots & demo** | [`docs/DEMO.md`](docs/DEMO.md) + [`docs/screenshots/`](docs/screenshots/) |

---

## What RefMind does

1. **Vote first** — YES/NO before any spoilers (reduces hindsight bias)
2. **Fan split reveal** — see how the crowd voted
3. **Four perspectives** — fan, rule, referee, camera (with voice reader)
4. **Emotion vs rule meter** — fan vote vs AI confidence
5. **What the camera missed** — OG broadcast scene + link to exact clip moment
6. **Ask the Ref** — incident-scoped Q&A (custom prompts per incident)
7. **Honest verdict** — Correct / Defensible but debatable / Likely wrong + confidence %
8. **Transparency** — clear disclaimer that official VAR data is not public

### Five demo incidents

| ID | Incident |
|----|----------|
| `wc2022-montiel-handball` | Montiel handball — World Cup Final 2022 |
| `wc2010-suarez-handball` | Suárez goal-line handball — Ghana 2010 |
| `euro2020-england-penalty` | Sterling penalty — England vs Denmark |
| `wc2022-saudi-offside` | Lautaro offside — Argentina vs Saudi Arabia |
| `ucl-2019-llorente-handball` | Llorente handball — Ajax vs Tottenham 2019 |

---

## IBM tools used

| IBM tool | Role in RefMind | Code / data |
|----------|-----------------|-------------|
| **IBM Granite** | Generates rule-grounded analysis, verdict reasoning, and Ask the Ref answers via watsonx.ai | `backend/app/services/granite.py`, `analyzer.py`, `ask_ref.py` |
| **Docling** | Parses official IFAB Laws of the Game PDF into structured text for ingestion | `backend/app/ingest/ingest_rules.py` |
| **LangChain** | Chunks rule text, builds embeddings, retrieves relevant IFAB passages for RAG | `backend/app/services/rag.py` |
| **Chroma** | Vector store for retrieved rule snippets at analysis time | `backend/data/chroma/` (created on ingest) |

**Supporting stack (not IBM):** React + Tailwind + Vite (frontend), FastAPI (backend).

**Demo mode:** Works without watsonx credentials — uses structured fallback responses so judges can run the full UI locally. Set `DEMO_MODE=false` and add watsonx keys for live Granite.

---

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) IBM watsonx.ai API key + project ID for live Granite

### Option A — One-click demo (Windows)

```powershell
cd refmind\scripts
start-demo.cmd
```

Opens **http://localhost:5173/?demo=wc2022-montiel-handball**

### Option B — Manual setup

**1. Backend** (port **8001**)

```powershell
cd refmind\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8001
```

**2. Frontend** (port **5173**)

```powershell
cd refmind\frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### Demo URLs

```
http://localhost:5173/?demo=wc2022-montiel-handball
http://localhost:5173/?demo=wc2010-suarez-handball
http://localhost:5173/?demo=euro2020-england-penalty
http://localhost:5173/?demo=wc2022-saudi-offside
http://localhost:5173/?demo=ucl-2019-llorente-handball
```

### Deploy on Vercel (no local servers)

Frontend + API deploy together. Demo mode is on by default — no `localhost` needed.

1. [vercel.com/new](https://vercel.com/new) → Import **diya28varne/hands-on-labs**
2. Set **Root Directory** to `refmind`
3. Deploy → open `https://your-app.vercel.app/?demo=wc2022-montiel-handball`

CLI (from `refmind/`): `npx vercel --prod`

Optional Vercel env vars: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `DEMO_MODE=false`

### Connect IBM Granite (watsonx.ai)

1. Create a project at [watsonx.ai](https://dataplatform.cloud.ibm.com/)
2. Create an IBM Cloud API key (IAM → API keys)
3. Edit `backend/.env`:

```env
WATSONX_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
DEMO_MODE=false
```

4. Test:

```powershell
cd refmind\backend
python -m app.scripts.test_granite
curl http://127.0.0.1:8001/health/granite
```

When live, responses include `"demo_mode": false`.

---

## Ingest IFAB rules (Docling + LangChain + Chroma)

Official PDF: `backend/data/rules/ifab-laws-2024-25.pdf`

**Re-download** (if needed):

```powershell
cd refmind\backend
python -m app.ingest.download_rules
```

**Ingest** (stop the API server first — Chroma file lock):

```powershell
cd refmind\backend
python -m app.ingest.ingest_rules
```

Expected: ~60 chunks tagged by topic (handball, offside, penalty, VAR). Docling uses `do_ocr=False` on the embedded-text IFAB PDF to avoid memory issues on laptops.

---

## Core user flow

```
Opening quote + vote YES/NO
        ↓
Fan % reveal
        ↓
Four perspectives (fan / rule / ref / camera) + voice reader
        ↓
Emotion vs rule · Pressure on ref · OG scene · Why fans disagree
        ↓
Debate mode · Change your mind · Trust score · Final verdict
        ↓
Ask the Ref · Transparency note · Next incident
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API status + Granite mode |
| GET | `/health/granite` | Granite connection test |
| GET | `/incidents` | List incidents (no spoilers) |
| GET | `/incidents/{id}` | Single incident for voting |
| POST | `/incidents/{id}/vote` | Fan % after user vote |
| POST | `/incidents/{id}/analyze` | Full AI analysis + OG scene |
| POST | `/incidents/{id}/mind-change` | Record vote flip after camera reveal |
| POST | `/ask-ref` | Incident-scoped Q&A |

---

## Screenshots & demo script

- **Demo walkthrough & screenshot guide:** [`docs/DEMO.md`](docs/DEMO.md)
- **90-second judge script:** [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
- **Screenshot folder:** [`docs/screenshots/`](docs/screenshots/) — add PNG captures for your submission

---

## Project structure

```
refmind/
├── README.md                 # This file
├── DEMO_SCRIPT.md            # 90-second pitch script
├── docs/
│   ├── DEMO.md               # Demo URLs + screenshot guide
│   └── screenshots/          # Add submission screenshots here
├── scripts/
│   ├── start-demo.cmd        # Windows one-click launch
│   ├── start-backend.cmd
│   └── start-frontend.cmd
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI routes
│   │   ├── data/
│   │   │   ├── incidents.json
│   │   │   ├── og_scenes.py
│   │   │   └── seed_rules.py
│   │   ├── ingest/           # Docling PDF ingestion
│   │   └── services/
│   │       ├── granite.py    # IBM Granite
│   │       ├── rag.py        # LangChain + Chroma
│   │       ├── analyzer.py
│   │       └── ask_ref.py
│   └── requirements.txt
└── frontend/
    ├── public/scenes/        # OG broadcast thumbnails
    └── src/
        ├── App.jsx
        ├── components/       # Vote + reveal UI
        └── data/askRefStarters.js
```

---

## MVP checklist

- [x] 5 controversial incidents
- [x] Vote-before-reveal flow
- [x] Fan percentage reveal
- [x] RAG on IFAB rules (Docling + LangChain + Chroma)
- [x] IBM Granite analysis (with demo fallback)
- [x] Referee + camera perspective
- [x] OG broadcast scenes with timestamped clip links
- [x] Voice reader (Read to me)
- [x] Ask the Ref (per-incident prompts)
- [x] Honest verdict + confidence
- [x] Transparency disclaimer
- [x] Future scope teaser (first incident)
- [x] Demo mode (no API key required)

---

## License & attribution

Built for IBM SkillsBuild AI Builders Challenge. IFAB Laws PDF used for rule grounding. OG scene thumbnails sourced from official match highlight clips on YouTube (see `backend/app/data/og_scenes.py`).
