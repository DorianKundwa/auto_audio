# Auto Audio 🎬🔊

**Next-Generation AI Sound Design & Multi-Track Studio for Video Creators.**  
Drop any video + subtitle script (or auto-transcribe with Whisper) → AI analyzes dramatic narrative cues → scores background music → places precision sound effects → provides a full DAW-style interactive timeline editor → renders sample-accurate multi-track audio with FFmpeg.

---

## 🌟 Key Features

- 🎧 **Intelligent Multi-Track AI Scoring**: Detects hooks, reveals, plot twists, contrasts, time jumps, tech anomalies, and climax moments in your script to place sound effects with millisecond precision.
- 🎛️ **DAW Multi-Track Studio Editor**: Interactive timeline with synchronized video preview, real-time playhead scrubber, sub-second timecode ruler, zoom controls, and individual track lanes for Narration, SFX, and Background Music.
- 📁 **103 Studio Sound Effects & 30 Ambient Scores**: Built-in, categorized sound library across 10 functional groups (*Booms, Impacts, Risers, Glitches, Whooshes, Transitions, Heartbeats, Clicks, Upbeat, Silence Drops*).
- ⚡ **Slide-Out Sound Library Drawer**: Search, filter, preview (▶), and insert any sound effect directly onto the timeline at your current video timecode with 1 click.
- 🚀 **One-Command Dynamic Launcher (`launch.py` / `start.bat`)**: Automatically finds open TCP ports for both backend and frontend, establishes cross-service environment routing, and launches your browser.
- 🎨 **shadcn/ui + Tailwind CSS + Lucide Icons**: Modern dark glassmorphic interface built with Radix UI primitives, smooth micro-interactions, responsive controls, and floating toast notifications.
- 🎙️ **Local Whisper Speech-to-Text Fallback**: No subtitle file? Transcribe narration audio on-device with `faster-whisper`.
- 🛡️ **Ultra-Fast Direct Streaming Pipeline**: Direct-to-FastAPI upload streaming supporting video files up to 2GB with sample-accurate FFmpeg audio mixing and volume ducking.

---

## 🎯 How It Works

```
Video + Script (.srt) ──▶ AI Semantic Analyzer ──▶ Interactive DAW Studio ──▶ FFmpeg Multi-Track Engine ──▶ Final Video
```

### Detection Triggers & Acoustic Mapping

| Narrative Tag | Script Triggers | Acoustic Profile | Sound Effect Placed |
| :--- | :--- | :--- | :---: |
| **HOOK** | *"What if I told you"*, *"Most people don't know"* | Ascending pitch sweep / tension swell | 🎵 **RISER** |
| **REVEAL** | *"never happened"*, *"the truth is"*, *"was actually"* | Sharp transient punch with acoustic decay | 🔊 **IMPACT** |
| **CLIMAX** | *"finally"*, *"everything changed"*, *"turning point"* | Subsonic low-end bass (<80Hz) resonance | 💥 **BOOM** |
| **GLITCH** | *"Mandela Effect"*, *"simulation"*, *"matrix"*, *"glitch"* | Granular bitcrushed artifacts & electrical stutter | ⚡ **GLITCH** |
| **TRANSITION**| *"Stage 1"*, *"Meanwhile"*, *"Years later"*, *"In 1943"* | Ethereal shimmer & camera shutter snaps | ⚡ **TRANSITION** |
| **CONTRAST** | *"but"*, *"however"*, *"in reality"*, *"on the other hand"*| Broadband Doppler air / wind rush | 💨 **WHOOSH** |
| **ANXIETY** | *"seconds remaining"*, *"heart racing"*, *"fear"* | Rhythmic low-end double thud & clock ticks | 💓 **HEARTBEAT** |
| **REWARD** | *"made millions"*, *"success"*, *"brilliant idea"*, *"profit"*| Harmonic bell chimes & cash register kaching | ✨ **UPBEAT** |
| **TACTILE** | *"click"*, *"press"*, *"button"*, *"select"*, *"type"* | Crisp high-frequency micro foley pop | 🖱️ **CLICK** |
| **DROP** | *"nothing happened"*, *"nobody came"*, *"empty"* | Sub-bass vacuum drop into acoustic silence | 🔇 **SILENCE DROP** |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS v4, shadcn/ui, Radix UI, Lucide Icons
- **Backend API**: Python 3.9+, FastAPI, Uvicorn, Pydantic v2
- **AI & Analysis**: Rule-based regex heuristics + Google Gemini Flash REST API (`gemini-flash-latest`)
- **Speech-to-Text**: `faster-whisper` (on-device local transcription)
- **Audio & Video Engine**: FFmpeg 6 (`amix`, `aloop`, `adelay`, `volume`, `-c:v copy`, `aac 192k`)

---

## ⚡ Quick Start

### 1. One-Click Launcher (Recommended)
Automatically detects open ports, configures proxying, and opens the studio in your browser:

```bash
python launch.py
```

Or on Windows:
```bash
start.bat
```

*Optional Flags:*
- `python launch.py --backend-port 8080 --frontend-port 4000` (custom ports)
- `python launch.py --no-browser` (do not auto-launch browser)

---

### 2. Manual Start

#### Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

- **Web Studio**: [http://localhost:3000](http://localhost:3000)
- **Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Project Architecture

```
auto_audio/
├── backend/
│   ├── main.py                     # FastAPI server, CORS & static file mounts
│   ├── build_ai_audio_catalog.py   # AI audio analysis & knowledge base builder
│   ├── models/schemas.py           # Pydantic schemas (SFXEvent, TimelineResult, etc.)
│   ├── routers/
│   │   ├── upload.py               # POST /api/upload (direct chunk streaming)
│   │   ├── analyze.py              # POST & GET /api/analyze/{id}
│   │   └── export.py               # POST /api/export/{id} (multi-track rendering)
│   └── services/
│       ├── analyzer.py             # Script parser + Gemini Flash REST tagger
│       ├── sfx_engine.py           # SFX placement, timing & intensity matcher
│       ├── music_engine.py         # Mood scoring & background track selector
│       ├── renderer.py             # Asynchronous FFmpeg filter graph engine
│       ├── transcriber.py          # faster-whisper STT integration
│       └── ai_audio_guide.py       # Programmatic AI knowledge base provider
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Upload dropzone & sound design presets
│   │   ├── layout.tsx              # Root layout with hydration suppression
│   │   ├── globals.css             # DAW studio & glassmorphism styling
│   │   └── analyze/[jobId]/        # DAW Multi-Track Studio & Video Inspector
│   ├── components/ui/              # shadcn/ui primitives (Button, Card, Slider, Switch, etc.)
│   └── lib/
│       ├── utils.ts                # Tailwind class merge helper (cn)
│       └── api.ts                  # Direct high-performance API client
│
├── assets/
│   ├── sfx/                        # 103 integrated sound effects (WAV & MP3)
│   │   ├── booms/                  # Subsonic drops & grand impacts
│   │   ├── impacts/                # Metal, wood, stone, and body hits
│   │   ├── risers/                 # Ascending sweeps & drone swells
│   │   ├── glitches/               # Tech buttons & robotic stutter
│   │   ├── whooshes/               # Doppler air, fire & wind rushes
│   │   ├── transitions/            # Magic shimmer & camera shutters
│   │   ├── heartbeats/             # Ticking clocks & pulse thuds
│   │   ├── clicks/                 # Micro foley & keyboard keys
│   │   ├── upbeat/                 # Reward chimes & cash registers
│   │   ├── silence/                # Sub drops & room tone
│   │   ├── metadata.json           # Indexed SFX catalog
│   │   └── ai_catalog.json         # Semantic AI catalog with trigger tags
│   └── music/                      # 30 integrated ambient score tracks
│       ├── dark_documentary/       # Tension & drone pads
│       ├── mysterious/             # Atmospheric & curious beds
│       ├── upbeat/                 # Uplifting & motivating rhythms
│       ├── metadata.json           # Indexed music catalog
│       └── ai_catalog.json         # Semantic AI music catalog
│
├── docs/
│   └── AI_SOUND_DESIGN_GUIDE.md    # Master AI Sound Design reference manual
├── launch.py                       # Cross-platform fullstack port launcher
├── start.bat                       # Windows one-click launcher
└── start.ps1                       # PowerShell launcher
```

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Master Play / Pause video & timeline |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek backward / forward 1 second |
| <kbd>L</kbd> | Toggle Slide-Out Sound Library Drawer |
| <kbd>Del</kbd> / <kbd>Backspace</kbd> | Delete selected sound effect on timeline |

---

## 📚 AI Knowledge Base & Audio Documentation

For complete acoustic profiles, frequency response charts, ducking calibration, and trigger keywords for all 103 sound effects and 30 music tracks, see [docs/AI_SOUND_DESIGN_GUIDE.md](docs/AI_SOUND_DESIGN_GUIDE.md).

To re-analyze or update the audio knowledge base after adding new sound files:
```bash
python backend/build_ai_audio_catalog.py
```

---

## 🔐 Environment Variables (`.env`)

```env
# Google Gemini API key for semantic script classification
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Override default Gemini model (defaults to gemini-flash-latest)
GEMINI_MODEL=gemini-flash-latest
```

---

## 📄 License

MIT License. Designed and built with ❤️ for video creators.
