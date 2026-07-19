from __future__ import annotations

import os

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.data.og_scenes import get_og_scene
from app.config import settings
from app.services.ask_ref import ask_ref
from app.services.analyzer import analyze_incident
from app.services.controversy import analyze_custom_controversy
from app.services.granite import test_granite_connection
from app.services.incidents import get_fan_result, get_incident, list_incidents
from app.services.mind_change import record_mind_change
from app.services.rag import seed_vectorstore

app = FastAPI(
    title="RefMind API",
    description="You saw what the referee saw. Now understand why you disagreed.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    if os.getenv("VERCEL") != "1":
        seed_vectorstore()


router = APIRouter()


class VoteRequest(BaseModel):
    user_vote: bool = Field(..., description="True = yes/foul, False = no/no foul")


class AnalyzeRequest(BaseModel):
    user_vote: bool


class MindChangeRequest(BaseModel):
    original_vote: bool
    changed_mind: bool
    new_vote: bool | None = None


class AskRefRequest(BaseModel):
    incident_id: str
    question: str = Field(..., min_length=1, max_length=500)
    analysis_context: dict | None = Field(
        default=None,
        description="Optional analysis snapshot from the reveal screen",
    )


class ControversyRequest(BaseModel):
    facts: str = Field(..., min_length=20, max_length=2000)
    side_a: str = Field(..., min_length=1, max_length=400)
    side_b: str = Field(..., min_length=1, max_length=400)


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "granite_live": settings.granite_available,
        "demo_mode": settings.demo_mode,
        "using_demo_fallback": not settings.granite_available,
        "watsonx_configured": settings.watsonx_configured,
        "model_id": settings.watsonx_model_id,
    }


@router.get("/health/granite")
def health_granite() -> dict:
    """Test live Granite connection (requires DEMO_MODE=false and valid credentials)."""
    return test_granite_connection()


@router.get("/incidents")
def get_incidents() -> list[dict]:
    return list_incidents()


@router.get("/incidents/{incident_id}")
def get_incident_by_id(incident_id: str) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "id": incident["id"],
        "title": incident["title"],
        "match": incident["match"],
        "minute": incident["minute"],
        "question": incident["question"],
        "description": incident["description"],
        "video_hint": incident["video_hint"],
        "user_vote_prompt": incident["user_vote_prompt"],
    }


@router.post("/incidents/{incident_id}/vote")
def submit_vote(incident_id: str, body: VoteRequest) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return get_fan_result(incident, body.user_vote)


@router.post("/incidents/{incident_id}/analyze")
def analyze(incident_id: str, body: AnalyzeRequest) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    fan = get_fan_result(incident, body.user_vote)
    analysis = analyze_incident(incident, body.user_vote)

    return {
        "incident_id": incident_id,
        "title": incident["title"],
        "match": incident["match"],
        "rule_citation": incident.get("rule_citation", incident.get("ground_truth_note", "").split(".")[0]),
        "referee_context": incident["referee_context"],
        "camera_context": incident["camera_context"],
        "og_scene": get_og_scene(incident),
        "pressure_context": incident.get("pressure_context"),
        "description": incident["description"],
        "question": incident["question"],
        **fan,
        **analysis,
    }


@router.post("/incidents/{incident_id}/mind-change")
def mind_change(incident_id: str, body: MindChangeRequest) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        return record_mind_change(incident_id, body.changed_mind)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/ask-ref")
def ask_the_ref(body: AskRefRequest) -> dict:
    incident = get_incident(body.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        return ask_ref(body.incident_id, body.question, body.analysis_context)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/controversy/analyze")
def analyze_controversy(body: ControversyRequest) -> dict:
    """Bring-your-own controversy — four-reason disagreement breakdown."""
    return analyze_custom_controversy(body.facts, body.side_a, body.side_b)


# Local dev: vite proxy strips /api → routes at /
# Vercel: requests arrive as /api/* → register both prefixes
app.include_router(router)
app.include_router(router, prefix="/api")
