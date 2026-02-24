"""
MedLens AI V2 — Real-Time Medical Emergency Triage & First-Aid Coach

Agent with:
1. Dual-mode LLM: Gemini Realtime (vision) or Mistral (text-only fallback)
2. YOLO pose detection for body/injury awareness
3. Deepgram STT + ElevenLabs TTS for hands-free operation
4. Tool calling: emergency services, triage, incident reports, CPR coaching
"""

import logging
import os
import json
from datetime import datetime
from typing import Any, Dict
from pathlib import Path

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import deepgram, elevenlabs, openrouter, getstream, ultralytics

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

load_dotenv()

# ---------- Dual-mode LLM selection ----------

def _create_llm():
    """
    Pick the best available LLM:
    - If GOOGLE_API_KEY is set → Gemini Realtime (can SEE video at 3fps)
    - Otherwise → Mistral via direct API (text-only, receives YOLO data)
    """
    google_key = os.getenv("GOOGLE_API_KEY")
    if google_key:
        from vision_agents.plugins import gemini
        logger.info("🎥 Using Gemini Realtime (vision mode — can see video)")
        return gemini.Realtime(fps=3)
    else:
        mistral_key = os.getenv("MISTRAL_API_KEY")
        logger.info("💬 Using Mistral (text mode — receives YOLO pose data only)")
        return openrouter.LLM(
            model="mistral-small-latest",
            api_key=mistral_key,
            base_url="https://api.mistral.ai/v1",
        )


# ---------- Incident report storage ----------

REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)


async def create_agent(**kwargs) -> Agent:
    """Create the MedLens AI V2 agent."""

    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="MedLens AI", id="medlens-agent"),
        instructions="Read @agent/medlens_instructions.md",
        llm=_create_llm(),
        tts=elevenlabs.TTS(model_id="eleven_flash_v2_5"),
        stt=deepgram.STT(eager_turn_detection=True),
        processors=[
            ultralytics.YOLOPoseProcessor(
                model_path="yolo11n-pose.pt",
                fps=5,
                conf_threshold=0.5,
            ),
        ],
    )

    # ---------- Gemini event handlers (only if Gemini is used) ----------

    if os.getenv("GOOGLE_API_KEY"):
        try:
            from vision_agents.plugins.gemini.events import (
                GeminiConnectedEvent,
                GeminiErrorEvent,
            )

            @agent.events.subscribe
            async def on_gemini_connected(event: GeminiConnectedEvent):
                logger.info(f"✅ Connected to Gemini model: {event.model}")

            @agent.events.subscribe
            async def on_gemini_error(event: GeminiErrorEvent):
                logger.error(f"❌ Gemini error: {event.error}")
        except ImportError:
            pass

    # ==========================================
    #  TOOL 1 — Emergency Services
    # ==========================================

    @agent.llm.register_function(
        description=(
            "Call emergency services (911) with a situation briefing. "
            "Use ONLY for genuinely life-threatening emergencies: "
            "cardiac arrest, severe bleeding, anaphylaxis, stroke, "
            "unconscious person not breathing, severe burns."
        )
    )
    async def call_emergency_services(
        situation_summary: str,
        severity: str,
        number_of_injured: int,
        injuries_detected: str,
    ) -> Dict[str, Any]:
        logger.info(f"🚨 EMERGENCY: [{severity}] {situation_summary}")
        return {
            "status": "emergency_services_notified",
            "severity": severity,
            "situation": situation_summary,
            "injuries": injuries_detected,
            "injured_count": number_of_injured,
            "message": (
                f"Emergency services notified. Severity: {severity}. "
                f"Continue first aid until help arrives."
            ),
        }

    # ==========================================
    #  TOOL 2 — Triage Classification
    # ==========================================

    @agent.llm.register_function(
        description=(
            "Classify triage severity. Categories: "
            "GREEN (minor), YELLOW (needs attention, stable), "
            "RED (life-threatening, urgent), BLACK (beyond first-aid help). "
            "Call this early in your assessment."
        )
    )
    async def classify_triage(
        category: str,
        reasoning: str,
        recommended_action: str,
    ) -> Dict[str, Any]:
        logger.info(f"🏥 TRIAGE: [{category}] {reasoning}")
        return {
            "triage_category": category,
            "reasoning": reasoning,
            "recommended_action": recommended_action,
            "message": f"Triage: {category}. {recommended_action}",
        }

    # ==========================================
    #  TOOL 3 — Incident Logging
    # ==========================================

    @agent.llm.register_function(
        description=(
            "Log an incident for record keeping. "
            "Use after assessing a situation to create a structured record."
        )
    )
    async def log_incident(
        incident_type: str,
        severity: str,
        description: str,
        actions_taken: str,
    ) -> Dict[str, Any]:
        timestamp = datetime.now().isoformat()
        logger.info(f"📝 LOG [{timestamp}]: [{severity}] {incident_type}")
        return {
            "status": "logged",
            "timestamp": timestamp,
            "incident_type": incident_type,
            "severity": severity,
        }

    # ==========================================
    #  TOOL 4 — Incident Report Generation (V2)
    # ==========================================

    @agent.llm.register_function(
        description=(
            "Generate a structured incident report summarizing the triage session. "
            "Call this when the user asks for a report, or when the session is ending. "
            "Include all relevant details about what was observed and actions taken."
        )
    )
    async def generate_incident_report(
        patient_description: str,
        triage_category: str,
        injuries_observed: str,
        first_aid_provided: str,
        outcome: str,
        additional_notes: str,
    ) -> Dict[str, Any]:
        timestamp = datetime.now()
        report_id = timestamp.strftime("%Y%m%d_%H%M%S")

        report = {
            "report_id": report_id,
            "timestamp": timestamp.isoformat(),
            "patient_description": patient_description,
            "triage_category": triage_category,
            "injuries_observed": injuries_observed,
            "first_aid_provided": first_aid_provided,
            "outcome": outcome,
            "additional_notes": additional_notes,
        }

        # Save as JSON
        report_path = REPORTS_DIR / f"incident_{report_id}.json"
        report_path.write_text(json.dumps(report, indent=2))

        # Save as Markdown
        md_report = f"""# Incident Report — {report_id}

| Field | Details |
|---|---|
| **Time** | {timestamp.strftime('%Y-%m-%d %H:%M:%S')} |
| **Triage** | {triage_category} |
| **Patient** | {patient_description} |

## Injuries Observed
{injuries_observed}

## First Aid Provided
{first_aid_provided}

## Outcome
{outcome}

## Notes
{additional_notes}
"""
        md_path = REPORTS_DIR / f"incident_{report_id}.md"
        md_path.write_text(md_report)

        logger.info(f"📄 REPORT saved: {report_path}")
        return {
            "status": "report_generated",
            "report_id": report_id,
            "file": str(report_path),
            "message": f"Incident report {report_id} has been saved.",
        }

    # ==========================================
    #  TOOL 5 — CPR Form Evaluation (V2)
    # ==========================================

    @agent.llm.register_function(
        description=(
            "Evaluate CPR technique based on YOLO pose keypoints. "
            "Call this when the user is practicing CPR and you can see their body position. "
            "Analyze: hand placement (center of chest), arm position (elbows locked straight), "
            "compression depth (estimated from shoulder-wrist distance changes), "
            "and rhythm (target 100-120 compressions per minute). "
            "Provide specific, actionable feedback."
        )
    )
    async def evaluate_cpr_form(
        hand_position: str,
        arm_alignment: str,
        compression_depth_estimate: str,
        rhythm_assessment: str,
        overall_score: int,
        feedback: str,
    ) -> Dict[str, Any]:
        logger.info(f"💪 CPR EVAL: score={overall_score}/10 — {feedback}")
        return {
            "hand_position": hand_position,
            "arm_alignment": arm_alignment,
            "compression_depth": compression_depth_estimate,
            "rhythm": rhythm_assessment,
            "score": overall_score,
            "feedback": feedback,
            "message": f"CPR score: {overall_score}/10. {feedback}",
        }

    return agent


async def join_call(
    agent: Agent, call_type: str, call_id: str, **kwargs
) -> None:
    """Handle joining a call and starting the agent."""
    call = await agent.create_call(call_type, call_id)

    async with agent.join(call):
        await agent.simple_response(
            text=(
                "Introduce yourself as MedLens AI, a real-time first-aid assistant. "
                "Mention you can help with emergencies, first-aid guidance, and CPR training. "
                "Ask what they need help with. Keep it to 2 sentences max."
            )
        )
        await agent.finish()


if __name__ == "__main__":
    Runner(
        AgentLauncher(create_agent=create_agent, join_call=join_call)
    ).cli()
