# 🏥 MedLens AI — Real-Time Medical Emergency Triage & First-Aid Coach

> **Vision Agents SDK Hackathon** — A multi-modal AI agent that watches, listens, and guides you through medical emergencies in real-time.

[![Vision Agents SDK](https://img.shields.io/badge/Powered%20by-Vision%20Agents%20SDK-blue)](https://visionagents.ai)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)](https://react.dev)

---

## 🎯 What is MedLens AI?

MedLens AI is a **real-time first-aid assistant** that uses your camera and microphone to:

1. **See** — YOLO pose detection identifies body positioning and movement in real-time
2. **Think** — DeepSeek R1 (via OpenRouter) provides intelligent medical guidance
3. **Listen** — Deepgram STT provides hands-free voice interaction (your hands are busy helping!)
4. **Guide** — ElevenLabs TTS speaks calm, step-by-step first-aid instructions
5. **Triage** — Classifies emergencies using standard triage categories (GREEN/YELLOW/RED/BLACK)
6. **Alert** — Can call emergency services with a structured briefing for critical situations

### 💡 The Problem

In medical emergencies, people panic. They don't know what to do. Googling "how to do CPR" with bloody hands isn't practical. MedLens AI turns your phone or laptop into a **real-time first-aid coach** — it watches what's happening, understands the severity, and talks you through it step by step.

---

## 🏗️ Architecture

```
┌──────────────────┐     Stream Edge      ┌──────────────────┐
│                  │    (Ultra-Low         │                  │
│  React Frontend  │◄──  Latency)  ──────►│  MedLens Agent   │
│  (Video + Audio) │    ~30ms             │  (Python)        │
│                  │                      │                  │
└──────────────────┘                      └──────┬───────────┘
        │                                        │
        │ Camera + Mic                           │ Processes
        ▼                                        ▼
   ┌─────────┐                          ┌──────────────────┐
   │  User   │                          │ DeepSeek R1      │ ← LLM (via OpenRouter)
   └─────────┘                          │ YOLO Pose        │ ← Body detection (5fps)
                                        │ Deepgram STT     │ ← Speech to text
                                        │ ElevenLabs TTS   │ ← Text to speech
                                        │ Tool Calling     │ ← Emergency services
                                        └──────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| **Edge Network** | Stream | Ultra-low latency video/audio transport (~30ms) |
| **Vision LLM** | DeepSeek R1 (via OpenRouter) | Intelligent medical guidance & reasoning |
| **Pose Detection** | Ultralytics YOLO | Body/pose awareness for injury assessment |
| **Speech-to-Text** | Deepgram | Hands-free voice input with eager turn detection |
| **Text-to-Speech** | ElevenLabs Flash v2.5 | Natural, calm voice output |
| **Frontend** | React 19 + Stream Video SDK | Video call UI with triage dashboard |
| **Backend** | Python 3.12 + Vision Agents SDK | Agent orchestration and tool calling |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- API keys (see below)

### 1. Clone & Install

```bash
git clone https://github.com/preeeetham/medlens-ai.git
cd medlens-ai

# Backend
uv sync

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure API Keys

```bash
cp .env.example .env
```

Fill in your `.env`:
| Key | Get it from |
|---|---|
| `STREAM_API_KEY` / `STREAM_API_SECRET` | [getstream.io](https://getstream.io/try-for-free) |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) |
| `ELEVENLABS_API_KEY` | [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) |
| `DEEPGRAM_API_KEY` | [Deepgram](https://console.deepgram.com) |

### 3. Run the Agent

```bash
# Console mode (opens built-in demo UI)
uv run agent/main.py run

# OR server mode (for frontend integration)
uv run agent/main.py serve
```

### 4. Run the Frontend (optional — for custom UI)

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` and enter your Stream credentials to connect.

---

## 📦 Project Structure

```
medlens-ai/
├── agent/
│   ├── main.py                 # Agent entry point (Gemini Realtime + YOLO + tools)
│   ├── medlens_instructions.md # Agent personality & first-aid protocols
│   └── knowledge/              # RAG knowledge base
│       ├── first_aid_protocols.md
│       └── emergency_procedures.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root with StreamVideo provider
│   │   ├── components/
│   │   │   ├── Landing.jsx     # Connection page
│   │   │   ├── VideoSession.jsx # Live video call UI
│   │   │   ├── Header.jsx      # Status header
│   │   │   └── EmergencyPanel.jsx # Triage + activity log
│   │   └── index.css           # Premium dark medical theme
│   └── package.json
├── .env.example
├── RESOURCES.md                # SDK docs & reference links
├── pyproject.toml
└── README.md
```

---

## 🏥 Features Deep Dive

### Real-Time Triage Classification
The agent classifies every situation using standard triage categories:
- 🟢 **GREEN** — Minor injuries (small cuts, bruises). Self-treatable.
- 🟡 **YELLOW** — Needs attention but stable (moderate burns, deep cuts).
- 🔴 **RED** — Life-threatening, urgent (cardiac arrest, severe bleeding, choking).
- ⚫ **BLACK** — Beyond first-aid help (requires advanced medical intervention).

### Voice-Guided First Aid
Covers protocols for: burns (1st/2nd/3rd degree), cuts & lacerations, choking (Heimlich), CPR, fractures, seizures, allergic reactions (anaphylaxis + EpiPen), heatstroke, poisoning, nosebleeds, and more.

### YOLO Pose Detection
Real-time body pose analysis at 15fps helps the agent understand:
- Body positioning (standing, lying down, recovery position)
- Technique verification (CPR compressions, Heimlich grip)
- Number of people in frame

### Emergency Services Integration
When detecting life-threatening emergencies, the agent can trigger an emergency call with:
- Situation summary
- Severity classification
- Number of injured
- Injuries detected

---

## 🔑 Vision Agents SDK Features Used

| Feature | How We Use It |
|---|---|
| **DeepSeek R1 (OpenRouter)** | LLM for medical reasoning & guidance |
| **YOLO Processor** | Pose detection for body awareness |
| **Deepgram STT** | Hands-free voice input |
| **ElevenLabs TTS** | Natural voice guidance |
| **Stream Edge** | Ultra-low latency video transport |
| **Tool Calling** | Emergency services, triage classification, incident logging |
| **Event System** | Connection monitoring, error handling |
| **Instructions (MD)** | Agent personality and medical protocols |

---

## 📄 License

MIT — Built for the [Vision Agents Hackathon](https://www.wemakedevs.org/hackathons/vision) by WeMakeDevs.
