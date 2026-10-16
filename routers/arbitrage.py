"""Arbitrage and Deal Optimization API Router for HostelBites."""

import io
from datetime import datetime
from typing import Optional, List, Union
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from services.tabpfn_service import evaluate_spoilage_risk, predict_spoilage_risk
from services.gemma_service import generate_midnight_deals
from services.voice_service import generate_cook_audio

router = APIRouter(prefix="/api", tags=["arbitrage"])


class AnalyzeRequest(BaseModel):
    stall_name: str = Field(default="Khandagiri Roll Corner", description="Name of the food stall")
    chicken_kg: float = Field(default=0.0, ge=0.0, description="Surplus chicken in kg")
    paneer_kg: float = Field(default=0.0, ge=0.0, description="Surplus paneer in kg")
    bread_units: int = Field(default=0, ge=0, description="Surplus buns, breads, parathas in units")
    is_exam_week: Union[int, bool] = Field(default=0, description="Exam week flag (1 or 0)")
    is_raining: Union[int, bool] = Field(default=0, description="Rain flag (1 or 0)")
    campus_name: Optional[str] = Field(default="SOA / ITER", description="Campus hub location")


class VoiceRequest(BaseModel):
    text: str = Field(..., description="Kitchen staff briefing script to synthesize")


@router.post("/analyze")
async def analyze_midnight_inventory(payload: AnalyzeRequest):
    """Audits midnight kitchen inventory with TabPFN and crafts viral promos via Gemma 2."""
    try:
        exam_flag = 1 if payload.is_exam_week else 0
        rain_flag = 1 if payload.is_raining else 0

        features = {
            "leftover_chicken_kg": payload.chicken_kg,
            "leftover_paneer_kg": payload.paneer_kg,
            "leftover_bread_units": payload.bread_units,
            "is_exam_week": exam_flag,
            "is_raining": rain_flag,
            "day_of_week": datetime.now().weekday(),
            "is_weekend": 1 if datetime.now().weekday() in (4, 5, 6) else 0,
        }
        tabpfn_result = evaluate_spoilage_risk(features)

        exam_text = "Exam Cram Session" if exam_flag else "Normal Campus Night"
        campus_context = f"{payload.campus_name} ({exam_text})"

        leftovers_dict = {
            "chicken_kg": payload.chicken_kg,
            "paneer_kg": payload.paneer_kg,
            "bread_units": payload.bread_units,
        }
        gemma_result = generate_midnight_deals(
            stall_name=payload.stall_name,
            leftovers=leftovers_dict,
            risk_level=tabpfn_result["risk_level"],
            exam_context=campus_context,
        )

        return {
            "success": True,
            "stall_name": payload.stall_name,
            "campus_name": payload.campus_name,
            "timestamp": datetime.now().isoformat(),
            # Enriched TabPFN Foundation telemetry
            "predicted_risk": tabpfn_result["risk_level"],
            "projected_waste_cost_inr": tabpfn_result["dead_stock_value_inr"],
            "recommended_discount_pct": tabpfn_result["recommended_markdown_pct"],
            "clearance_window_hours": tabpfn_result["clearance_window_hours"],
            "clearance_speed": tabpfn_result["clearance_target_text"],
            "class_probabilities": tabpfn_result["class_probabilities"],
            "anomaly_flag": tabpfn_result["anomaly_flag"],
            "confidence_score": tabpfn_result["confidence_score"],
            "model_engine": tabpfn_result["model_engine"],
            # Viral creative outputs
            "combos": gemma_result.get("combos", []),
            "whatsapp_broadcast": gemma_result.get("whatsapp_broadcast", ""),
            "line_cook_instruction": gemma_result.get("line_cook_instruction", ""),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Arbitrage analysis failed: {str(exc)}",
        )


@router.post("/voice-brief")
async def stream_voice_briefing(payload: VoiceRequest):
    """Streams ElevenLabs speech briefing for line cooks."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text briefing cannot be empty.")

    audio_bytes = generate_cook_audio(payload.text.strip())

    if not audio_bytes:
        return Response(
            content=b"",
            status_code=status.HTTP_204_NO_CONTENT,
            headers={
                "X-Audio-Status": "Missing-Key-Or-Unavailable",
                "X-Audio-Notice": "Configure ELEVENLABS_API_KEY in .env to stream audio",
            },
        )

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": "inline; filename=cook_briefing.mp3",
            "Cache-Control": "no-cache",
        },
    )


class AuditRequest(BaseModel):
    stall_name: Optional[str] = Field(default="Khandagiri Night Roll Corner")
    campus_hub: Optional[str] = Field(default="SOA / ITER, Jagamara")
    campus_name: Optional[str] = None
    day_of_week: Optional[int] = None
    is_exam_week: Union[int, bool] = 0
    is_raining: Union[int, bool] = 0
    is_weekend: Optional[Union[int, bool]] = None
    leftover_chicken_kg: Optional[float] = None
    chicken_kg: Optional[float] = None
    leftover_paneer_kg: Optional[float] = None
    paneer_kg: Optional[float] = None
    leftover_bread_units: Optional[int] = None
    bread_units: Optional[int] = None


class SpeakRequest(BaseModel):
    script: Optional[str] = None
    text: Optional[str] = None


@router.post("/audit")
async def audit_endpoint(payload: AuditRequest):
    """Dual compatibility endpoint matching tech-editorial frontend."""
    chicken = payload.leftover_chicken_kg if payload.leftover_chicken_kg is not None else (payload.chicken_kg or 0.0)
    paneer = payload.leftover_paneer_kg if payload.leftover_paneer_kg is not None else (payload.paneer_kg or 0.0)
    bread = payload.leftover_bread_units if payload.leftover_bread_units is not None else (payload.bread_units or 0)
    campus = payload.campus_hub or payload.campus_name or "SOA / ITER, Jagamara"
    exam_flag = 1 if payload.is_exam_week else 0
    rain_flag = 1 if payload.is_raining else 0

    dow = payload.day_of_week if payload.day_of_week is not None else datetime.now().weekday()
    weekend = 1 if (payload.is_weekend or dow in (4, 5, 6)) else 0

    features = {
        "leftover_chicken_kg": chicken,
        "leftover_paneer_kg": paneer,
        "leftover_bread_units": bread,
        "is_exam_week": exam_flag,
        "is_raining": rain_flag,
        "day_of_week": dow,
        "is_weekend": weekend,
    }
    tabpfn_result = evaluate_spoilage_risk(features)
    risk_level = tabpfn_result["risk_level"]
    markdown = tabpfn_result["recommended_markdown_pct"]

    gemma_result = generate_midnight_deals(
        stall_name=payload.stall_name or "Khandagiri Night Roll Corner",
        leftovers={"chicken_kg": chicken, "paneer_kg": paneer, "bread_units": bread},
        risk_level=risk_level,
        exam_context=f"{campus} ({'Exam Session' if exam_flag else 'Regular'})",
    )

    # Format structured combo cards for the frontend
    formatted_combos = [
        {
            "name": "End-Sem All-Nighter Double Roll Combo",
            "items": f"1x Jumbo Butter Chicken Roll ({max(0.5, chicken * 0.2):.1f}kg batch) + Thums Up 250ml",
            "original_price": 140,
            "flash_price": int(round(140 * (1 - markdown / 100))),
            "savings": f"SAVE ₹{140 - int(round(140 * (1 - markdown / 100)))} ({markdown}% OFF)",
        },
        {
            "name": "Midnight Paneer Burst Paratha Pack",
            "items": f"2x Crispy Paneer Parathas ({max(0.3, paneer * 0.2):.1f}kg batch) + Mint Chutney",
            "original_price": 160,
            "flash_price": int(round(160 * (1 - markdown / 100))),
            "savings": f"SAVE ₹{160 - int(round(160 * (1 - markdown / 100)))} ({markdown}% OFF)",
        },
    ]

    return {
        "status": "success",
        "data": {
            "risk_analysis": tabpfn_result,
            "combos": formatted_combos,
            "whatsapp_broadcast": gemma_result.get("whatsapp_broadcast", ""),
            "cook_audio_script": gemma_result.get("line_cook_instruction", ""),
        },
    }



@router.post("/speak")
async def speak_endpoint(payload: SpeakRequest):
    """Audio endpoint matching tech-editorial frontend."""
    text_to_speak = payload.script or payload.text or ""
    if not text_to_speak.strip():
        raise HTTPException(status_code=400, detail="Script text cannot be empty.")

    audio_bytes = generate_cook_audio(text_to_speak.strip())
    if not audio_bytes:
        return Response(
            content=b"",
            status_code=status.HTTP_204_NO_CONTENT,
            headers={"X-Audio-Status": "Unavailable"},
        )

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=cook_audio.mp3"},
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "HostelBites"}
