# Auto Audio 🎬🔊

**AI-powered sound design for video creators.**  
Drop a video + SRT narration → AI analyzes the script → selects background music → places SFX at exactly the right dramatic moments → exports a fully sound-designed video.

---

## What it does

```
Video + SRT ──▶ AI Analysis ──▶ SFX Timeline ──▶ FFmpeg Render ──▶ Final Video
```

| Detection | What it finds | SFX placed |
|---|---|---|
| **Reveal** | "never happened", "the truth is" | 🔊 IMPACT → silence |
| **Hook** | "What if I told you", "Most people don't know" | 🎵 RISER |
| **Climax** | "finally", "everything changed" | 💥 BOOM |
| **Glitch** | "Mandela Effect", "simulation", "glitch" | ⚡ GLITCH |
| **Contrast** | "but", "however", "in reality" | 💨 WHOOSH |
| **Stage transition** | "Stage 1", "Meanwhile", "Years later" | ⚡ TRANSITION |
| **Question** | "The real question is", "Why did" | 🎵 riser |
| **Ending** | "In conclusion", "that's why" | 🔊 soft impact |
| **Drop** | Dramatic deflation | 🔇 SILENCE |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Backend | Python 3.9 + FastAPI + Uvicorn |
| AI analysis | Rules engine + Gemini 2.0 Flash |
| Transcription | faster-whisper (local, no API needed) |
| Audio | pydub + FFmpeg filter graph |
| Video | FFmpeg 6 (copy video stream, re-encode audio) |

---

## Quick Start

### 1. Generate placeholder SFX (run once)
```bash
python backend/generate_placeholders.py
```

### 2. Start the backend
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start the frontend
```bash
cd frontend
npm run dev
```

### 4. Open
- **App**: http://localhost:3000
- **API docs**: http://localhost:8000/docs

---

## Project Structure

```
auto_audio/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── models/schemas.py       # Pydantic data models
│   ├── services/
│   │   ├── srt_parser.py       # SRT → segments
│   │   ├── transcriber.py      # faster-whisper fallback
│   │   ├── analyzer.py         # Rules + Gemini AI tagger
│   │   ├── sfx_engine.py       # Tag → SFX file + timestamp
│   │   ├── music_engine.py     # Mood-based music selection
│   │   └── renderer.py         # FFmpeg filter graph builder
│   ├── routers/
│   │   ├── upload.py           # POST /api/upload
│   │   ├── analyze.py          # POST /api/analyze/{job_id}
│   │   └── export.py           # POST /api/export/{job_id}
│   └── generate_placeholders.py # One-time SFX generator
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Upload + control panel
│   │   └── analyze/[jobId]/    # Timeline review + export
│   └── app/globals.css         # Design system (glassmorphism)
│
├── assets/
│   ├── sfx/                    # SFX WAV library
│   │   ├── impacts/
│   │   ├── booms/
│   │   ├── risers/
│   │   ├── glitches/
│   │   ├── whooshes/
│   │   ├── transitions/
│   │   ├── silence/
│   │   └── metadata.json       # SFX catalog
│   └── music/
│       ├── dark_documentary/
│       ├── mysterious/
│       ├── upbeat/
│       └── metadata.json       # Music catalog
│
├── uploads/                    # Uploaded job files (auto-created)
└── outputs/                    # Rendered videos (auto-created)
```

---

## Replace placeholder SFX

Drop any `.wav` or `.mp3` into the right folder and re-run the generator to update `metadata.json`:

```
assets/sfx/impacts/my_real_impact.wav
assets/sfx/risers/professional_riser.wav
assets/music/dark_documentary/real_track.wav
```

Then re-run:
```bash
python backend/generate_placeholders.py
```

The metadata catalog updates automatically.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/upload` | POST | Upload video + optional SRT |
| `/api/analyze/{job_id}` | POST | Run AI analysis, returns timeline |
| `/api/analyze/{job_id}` | GET | Retrieve stored timeline |
| `/api/export/{job_id}` | POST | Render and download final MP4 |
| `/api/health` | GET | Health check |

Full interactive docs: http://localhost:8000/docs

---

## Environment

```env
GEMINI_API_KEY=your_key_here
GOOGLE_CLOUD_PROJECT=projects/your_project
```
