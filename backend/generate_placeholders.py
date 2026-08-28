#!/usr/bin/env python3
"""
Generate placeholder SFX and music WAV files for auto_audio.

Run once from the project root:
    python backend/generate_placeholders.py

Each generated WAV is a scientifically correct placeholder that conveys
the right emotional character (impact, riser, glitch, etc.).
Replace individual files at any time with real production SFX — the metadata
system will automatically pick them up on the next run.
"""

import json
import wave
import struct
import math
import random
import os
from pathlib import Path

SAMPLE_RATE = 44100
ROOT = Path(__file__).parent.parent  # project root
SFX_ROOT = ROOT / "assets" / "sfx"
MUSIC_ROOT = ROOT / "assets" / "music"

# ── helpers ──────────────────────────────────────────────────────────────────

def write_wav(path: Path, samples: list[float], sr: int = SAMPLE_RATE):
    """Write a list of float samples [-1,1] as a 16-bit stereo WAV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    clamped = [max(-1.0, min(1.0, s)) for s in samples]
    int_samples = [int(s * 32767) for s in clamped]
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        # Interleave L/R (identical — mono content in stereo container)
        frames = b"".join(
            struct.pack("<hh", v, v) for v in int_samples
        )
        wf.writeframes(frames)
    print(f"  wrote {path.relative_to(ROOT)}  ({len(samples)/sr:.2f}s)")


def linspace(start: float, stop: float, n: int) -> list[float]:
    if n <= 1:
        return [start]
    return [start + (stop - start) * i / (n - 1) for i in range(n)]


def sine(freq: float, dur: float, amp: float = 1.0) -> list[float]:
    n = int(SAMPLE_RATE * dur)
    return [amp * math.sin(2 * math.pi * freq * i / SAMPLE_RATE) for i in range(n)]


def envelope(samples: list[float], attack: float = 0.01, release: float = 0.15) -> list[float]:
    n = len(samples)
    atk = int(n * attack)
    rel = int(n * release)
    out = list(samples)
    for i in range(atk):
        out[i] *= i / atk
    for i in range(rel):
        idx = n - rel + i
        out[idx] *= (rel - i) / rel
    return out


def mix(*tracks: list[float]) -> list[float]:
    length = max(len(t) for t in tracks)
    result = [0.0] * length
    for t in tracks:
        for i, v in enumerate(t):
            result[i] += v
    return result


def exp_decay(samples: list[float], rate: float = 5.0) -> list[float]:
    n = len(samples)
    return [v * math.exp(-rate * i / SAMPLE_RATE) for i, v in enumerate(samples)]


def white_noise(dur: float, amp: float = 0.3) -> list[float]:
    n = int(SAMPLE_RATE * dur)
    return [amp * (random.random() * 2 - 1) for _ in range(n)]

# ── SFX generators ───────────────────────────────────────────────────────────

def gen_impact(variant: int = 1) -> list[float]:
    """Deep impact — used for REVEAL / ENDING."""
    freq = [75, 90, 65][variant % 3]
    dur = 1.8

    # Sub bass thud with exponential decay
    bass = sine(freq, dur, amp=0.7)
    bass = exp_decay(bass, rate=6.0)

    # High transient crack at t=0
    crack_dur = 0.04
    crack = sine(800 + variant * 200, crack_dur, amp=0.45)
    crack = exp_decay(crack, rate=80.0)

    # Noise burst
    noise = white_noise(0.08, amp=0.20)

    # Combine
    result = list(bass)
    for i, v in enumerate(crack):
        result[i] += v
    for i, v in enumerate(noise):
        result[i] += v

    return envelope(result, attack=0.001, release=0.25)


def gen_boom(variant: int = 1) -> list[float]:
    """Ultra-heavy boom — used for CLIMAX."""
    dur = 2.5
    sub = sine(40, dur, amp=0.8)
    sub = exp_decay(sub, rate=3.0)

    mid = sine(90, dur, amp=0.35)
    mid = exp_decay(mid, rate=5.0)

    noise = white_noise(dur, amp=0.15)
    noise_decay = [noise[i] * math.exp(-8 * i / SAMPLE_RATE) for i in range(len(noise))]

    result = mix(sub, mid, noise_decay)
    return envelope(result, attack=0.001, release=0.20)


def gen_riser(variant: int = 1) -> list[float]:
    """Frequency sweep riser — used for HOOK / QUESTION."""
    dur = 3.0 + variant * 0.5
    n = int(SAMPLE_RATE * dur)
    start_freq = 150 + variant * 50
    end_freq = 3500 + variant * 500

    # Quadratic frequency sweep
    result = []
    phase = 0.0
    noise_amp = 0.08
    for i in range(n):
        t = i / SAMPLE_RATE
        progress = t / dur
        freq = start_freq + (end_freq - start_freq) * (progress ** 2)
        phase += 2 * math.pi * freq / SAMPLE_RATE
        amp = 0.35 * progress  # crescendo
        sample = amp * math.sin(phase)
        # subtle noise
        sample += noise_amp * progress * (random.random() * 2 - 1)
        result.append(sample)

    return envelope(result, attack=0.10, release=0.05)


def gen_glitch(variant: int = 1) -> list[float]:
    """Digital glitch artifact — used for GLITCH."""
    dur = 0.7 + variant * 0.1
    n = int(SAMPLE_RATE * dur)
    result = [0.0] * n

    burst_count = 12 + variant * 4
    for _ in range(burst_count):
        start = random.randint(0, max(0, n - 500))
        length = random.randint(100, 800)
        freq = random.choice([440, 880, 1320, 1760, 3520])
        amp = random.uniform(0.3, 0.6)
        for j in range(length):
            if start + j >= n:
                break
            result[start + j] += amp * math.sin(2 * math.pi * freq * j / SAMPLE_RATE)

    return envelope(result, attack=0.005, release=0.10)


def gen_whoosh(variant: int = 1) -> list[float]:
    """Whoosh transition — used for CONTRAST / STAGE_TRANSITION."""
    dur = 1.2 + variant * 0.2
    n = int(SAMPLE_RATE * dur)

    noise_raw = [random.random() * 2 - 1 for _ in range(n)]

    # Simple 1-pole high-pass filter
    alpha = 0.9
    hp = [0.0] * n
    hp[0] = noise_raw[0]
    for i in range(1, n):
        hp[i] = alpha * (hp[i - 1] + noise_raw[i] - noise_raw[i - 1])

    # Bell amplitude envelope (peaks in the middle)
    env = [math.sin(math.pi * i / n) ** 0.7 for i in range(n)]
    result = [0.45 * hp[i] * env[i] for i in range(n)]
    return result


def gen_transition(variant: int = 1) -> list[float]:
    """Transition hit — used for STAGE_TRANSITION."""
    # Combine a short impact with a whoosh
    impact = gen_impact(variant)
    whoosh = gen_whoosh(variant)
    length = max(len(impact), len(whoosh))
    result = [0.0] * length
    for i, v in enumerate(impact):
        result[i] += v * 0.6
    for i, v in enumerate(whoosh):
        result[i] += v * 0.5
    return result


def gen_silence(variant: int = 1) -> list[float]:
    """Near-silence drop — used for DROP tag."""
    dur = 1.5
    n = int(SAMPLE_RATE * dur)
    # Very quiet room tone (almost nothing)
    return [0.002 * (random.random() * 2 - 1) for _ in range(n)]


def gen_heartbeat(variant: int = 1) -> list[float]:
    """Slow heartbeat — for tension ambience."""
    dur = 2.5
    n = int(SAMPLE_RATE * dur)
    result = [0.0] * n
    for beat_time in [0.3, 0.6]:
        start = int(beat_time * SAMPLE_RATE)
        beat_dur = int(0.15 * SAMPLE_RATE)
        for j in range(beat_dur):
            if start + j >= n:
                break
            t = j / SAMPLE_RATE
            v = 0.6 * math.sin(2 * math.pi * 60 * t) * math.exp(-30 * t)
            result[start + j] += v
    return result


# ── Music generators ──────────────────────────────────────────────────────────

def gen_music_track(mood: str, dur_sec: int = 480) -> list[float]:
    """
    Generate a ~8-minute ambient music pad.
    mood: 'dark_documentary' | 'mysterious' | 'upbeat'
    """
    CHORD_SETS = {
        "dark_documentary": [  # D minor feel
            (73.4, 110.0, 146.8, 220.0),  # D2, A2, D3, A3
        ],
        "mysterious": [        # B diminished feel
            (61.7, 92.5, 123.5, 185.0),   # B1, F#2, B2, F#3
        ],
        "upbeat": [            # F major feel
            (87.3, 130.8, 174.6, 261.6),  # F2, C3, F3, C4
        ],
    }
    freqs = CHORD_SETS.get(mood, CHORD_SETS["dark_documentary"])[0]
    lfo_rates = {"dark_documentary": 0.04, "mysterious": 0.025, "upbeat": 0.08}
    lfo_rate = lfo_rates.get(mood, 0.04)

    n = int(SAMPLE_RATE * dur_sec)
    result = [0.0] * n

    for fi, freq in enumerate(freqs):
        phase_offset = fi * math.pi / 4
        for i in range(n):
            t = i / SAMPLE_RATE
            lfo = 0.25 * math.sin(2 * math.pi * lfo_rate * t + phase_offset)
            amp = (0.5 + lfo) * 0.25 / len(freqs)
            result[i] += amp * math.sin(2 * math.pi * freq * t + phase_offset)

    # Add subtle noise floor
    noise_amp = 0.008
    for i in range(n):
        result[i] += noise_amp * (random.random() * 2 - 1)

    # Fade in/out
    fade = int(SAMPLE_RATE * 3)
    for i in range(fade):
        result[i] *= i / fade
        result[n - 1 - i] *= i / fade

    return result


# ── Main ─────────────────────────────────────────────────────────────────────

# Maps folder name → (generator_fn, count, intensity, duration, moods, canonical_type)
# canonical_type is the value written to metadata.json and used by sfx_engine.py
SFX_TYPES = {
    "impacts":     (gen_impact,     3, 0.75, 1.8,  ["dark", "dramatic"],              "impact"),
    "booms":       (gen_boom,       2, 0.85, 2.5,  ["dark", "dramatic", "heavy"],     "boom"),
    "risers":      (gen_riser,      2, 0.55, 3.5,  ["tension", "building"],           "riser"),
    "glitches":    (gen_glitch,     3, 0.65, 0.8,  ["glitch", "digital", "mysterious"], "glitch"),
    "whooshes":    (gen_whoosh,     2, 0.45, 1.4,  ["transition", "motion"],          "whoosh"),
    "heartbeats":  (gen_heartbeat,  1, 0.40, 2.5,  ["tension", "dark"],               "heartbeat"),
    "silence":     (gen_silence,    1, 0.05, 1.5,  ["drop", "silence"],               "silence"),
    "transitions": (gen_transition, 2, 0.55, 2.0,  ["transition", "stage"],           "transition"),
}

MUSIC_MOODS = ["dark_documentary", "mysterious", "upbeat"]


def main():
    sfx_catalog = []
    music_catalog = []

    print("\n[SFX] Generating placeholder SFX files...")
    for sfx_folder, (gen_fn, count, intensity, duration, moods, sfx_type) in SFX_TYPES.items():
        folder = SFX_ROOT / sfx_folder
        for variant in range(1, count + 1):
            filename = f"{sfx_type}_{variant:02d}.wav"
            path = folder / filename
            if path.exists():
                print(f"  skip (exists): {path.relative_to(ROOT)}")
            else:
                samples = gen_fn(variant)
                write_wav(path, samples)

            sfx_catalog.append({
                "filename": filename,
                "type": sfx_type,
                "intensity": round(intensity + (variant - 1) * 0.05, 2),
                "duration": duration,
                "mood": moods,
                "placeholder": True,
            })

    print("\n[MUSIC] Generating placeholder music tracks (~8 min each, please wait)...")
    for mood in MUSIC_MOODS:
        folder = MUSIC_ROOT / mood
        filename = f"{mood}_01.wav"
        path = folder / filename
        if path.exists():
            print(f"  skip (exists): {path.relative_to(ROOT)}")
        else:
            print(f"  generating {mood}...")
            samples = gen_music_track(mood, dur_sec=480)
            write_wav(path, samples)

        music_catalog.append({
            "filename": filename,
            "folder": mood,
            "moods": [mood],
            "duration": 480,
            "placeholder": True,
        })

    # Write metadata catalogs
    sfx_meta_path = SFX_ROOT / "metadata.json"
    with open(sfx_meta_path, "w") as f:
        json.dump(sfx_catalog, f, indent=2)
    print(f"\n[OK] SFX metadata -> {sfx_meta_path.relative_to(ROOT)}")

    music_meta_path = MUSIC_ROOT / "metadata.json"
    with open(music_meta_path, "w") as f:
        json.dump(music_catalog, f, indent=2)
    print(f"[OK] Music metadata -> {music_meta_path.relative_to(ROOT)}")

    print("\n[DONE] Placeholder generation complete!")
    print("   Replace any WAV in assets/sfx/ or assets/music/ with real files.")
    print("   The metadata.json catalogs are auto-updated by this script.\n")


if __name__ == "__main__":
    main()
