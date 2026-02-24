"""
MedLens AI — Real-Time Medical Emergency Triage & First-Aid Coach

Main agent entry point. Creates a Vision Agent that:
1. Uses OpenRouter LLM (DeepSeek R1) for intelligent medical guidance
2. Listens to the user via Deepgram STT (hands-free operation)
3. Speaks calm first-aid guidance via ElevenLabs TTS
4. Runs YOLO pose detection for body/injury awareness
5. Registers tool functions for emergency services & incident logging
"""

import logging
from datetime import datetime
import os
from typing import Any, Dict

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import deepgram, elevenlabs, openrouter, getstream, ultralytics

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

load_dotenv()


async def create_agent(**kwargs) -> Agent:
    """Create the MedLens AI agent with all integrations."""

    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="MedLens AI", id="medlens-agent"),
        instructions="Read @agent/medlens_instructions.md",
        # Mistral LLM — using Mistral API directly (bypasses OpenRouter rate limits)
        llm=openrouter.LLM(
            model="mistral-small-latest",
            api_key=os.getenv("MISTRAL_API_KEY"),
            base_url="https://api.mistral.ai/v1",
        ),
        # ElevenLabs — natural, calm voice output for guided instructions
        tts=elevenlabs.TTS(model_id="eleven_flash_v2_5"),
        # Deepgram — hands-free speech recognition with eager turn detection
        stt=deepgram.STT(eager_turn_detection=True),
        # YOLO — real-time pose detection (lowered fps to conserve resources)
        processors=[
            ultralytics.YOLOPoseProcessor(
                model_path="yolo11n-pose.pt",
                fps=5,
                conf_threshold=0.5,
            ),
        ],
    )

    # --- Tool Calling: Emergency Response Functions ---

    @agent.llm.register_function(
        description=(
            "Call emergency services (911 or local emergency number) with a situation briefing. "
            "Use ONLY when you detect a genuinely life-threatening emergency such as: "
            "cardiac arrest, severe uncontrolled bleeding, anaphylaxis, stroke symptoms, "
            "unconscious person not breathing, or severe burns covering large areas."
        )
    )
    async def call_emergency_services(
        situation_summary: str,
        severity: str,
        number_of_injured: int,
        injuries_detected: str,
    ) -> Dict[str, Any]:
        """Simulates calling emergency services with context."""
        logger.info(
            f"🚨 EMERGENCY CALL TRIGGERED: [{severity}] {situation_summary}"
        )
        logger.info(f"   Injuries: {injuries_detected} | Count: {number_of_injured}")
        return {
            "status": "emergency_services_notified",
            "severity": severity,
            "situation": situation_summary,
            "injuries": injuries_detected,
            "injured_count": number_of_injured,
            "message": (
                f"Emergency services have been notified. "
                f"Severity: {severity}. {situation_summary}. "
                f"Continue providing first aid until help arrives."
            ),
        }

    @agent.llm.register_function(
        description=(
            "Log an incident with details for record keeping and follow-up. "
            "Use this after assessing a situation to create a structured incident record."
        )
    )
    async def log_incident(
        incident_type: str,
        severity: str,
        description: str,
        actions_taken: str,
    ) -> Dict[str, Any]:
        """Log incident details for records."""
        timestamp = datetime.now().isoformat()
        logger.info(
            f"📝 INCIDENT LOG [{timestamp}]: [{severity}] {incident_type} — {description}"
        )
        logger.info(f"   Actions: {actions_taken}")
        return {
            "status": "logged",
            "timestamp": timestamp,
            "incident_type": incident_type,
            "severity": severity,
            "description": description,
            "actions_taken": actions_taken,
        }

    @agent.llm.register_function(
        description=(
            "Classify the triage severity of the current situation. "
            "Use standard triage categories: "
            "GREEN (minor, non-urgent), YELLOW (delayed, needs attention but stable), "
            "RED (immediate, life-threatening, needs urgent care), "
            "BLACK (expectant, beyond help without advanced medical intervention). "
            "Call this early in your assessment to set the priority level."
        )
    )
    async def classify_triage(
        category: str,
        reasoning: str,
        recommended_action: str,
    ) -> Dict[str, Any]:
        """Classify triage severity and log it."""
        logger.info(f"🏥 TRIAGE: [{category}] {reasoning}")
        logger.info(f"   Recommended: {recommended_action}")
        return {
            "triage_category": category,
            "reasoning": reasoning,
            "recommended_action": recommended_action,
            "message": f"Triage classified as {category}. {recommended_action}",
        }

    return agent


async def join_call(
    agent: Agent, call_type: str, call_id: str, **kwargs
) -> None:
    """Handle joining a call/room and starting the agent."""
    call = await agent.create_call(call_type, call_id)

    async with agent.join(call):
        # Initial greeting — warm, professional, concise
        await agent.simple_response(
            text=(
                "Introduce yourself as MedLens AI, a real-time first-aid assistant. "
                "Tell the user you are ready to help with any medical emergency or "
                "first-aid situation. Ask them to describe what they see or need help with. "
                "Be warm but professional. Keep it brief — 2 sentences max."
            )
        )
        # Keep running until the call ends
        await agent.finish()


if __name__ == "__main__":
    Runner(
        AgentLauncher(create_agent=create_agent, join_call=join_call)
    ).cli()
