/**
 * AutoAudio — Obsidian Sonic Lab Front-end Application Engine
 * Pure Vanilla JavaScript Client
 */

// ── State ───────────────────────────────────────────────────────────────────
const state = {
  currentView: "session", // 'session' | 'analysis' | 'studio'
  jobId: null,
  videoFile: null,
  srtFile: null,
  scriptMode: "upload", // 'upload' | 'transcribe'
  aiStyle: null, // Autonomous AI sound director profile
  settings: {
    music_enabled: true,
    sfx_enabled: true,
    silence_drops: true,
    stage_detection: true,
    reveal_detection: true,
    hook_detection: true,
    music_intensity: 0.75,
    sfx_intensity: 0.7,
  },
  videoDuration: 60,
  currentTime: 0,
  isPlaying: false,
  zoom: 1.0,
  snapEnabled: true,
  events: [],
  selectedEventId: null,
  analyzedSegments: [],
  musicConfig: null,
  sfxLibrary: [],
  activeLibraryCategory: "all",
  previewAudio: new Audio(),
  musicAudio: new Audio(),
  exportResolution: "1080p",
};

// ── Initialization ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  checkBackendHealth();
  loadSfxCatalog();
  setupKeyboardShortcuts();

  // Check URL params for existing jobId
  const urlParams = new URLSearchParams(window.location.search);
  const existingJobId = urlParams.get("job");
  if (existingJobId) {
    loadExistingTimeline(existingJobId);
  }
});

// ── View Switching ──────────────────────────────────────────────────────────
function switchView(viewName) {
  state.currentView = viewName;
  document.getElementById("view-session").classList.toggle("hidden", viewName !== "session");
  document.getElementById("view-analysis").classList.toggle("hidden", viewName !== "analysis");
  document.getElementById("view-studio").classList.toggle("hidden", viewName !== "studio");

  // Update sidebar active buttons
  document.getElementById("nav-studio")?.classList.toggle("bg-primary-container", viewName === "studio");
  document.getElementById("nav-studio")?.classList.toggle("text-on-primary-container", viewName === "studio");
  document.getElementById("nav-assets")?.classList.toggle("bg-primary-container", viewName === "session");
  document.getElementById("nav-assets")?.classList.toggle("text-on-primary-container", viewName === "session");
}

// ── Backend Health ──────────────────────────────────────────────────────────
async function checkBackendHealth() {
  const dot = document.getElementById("engine-status-dot");
  const text = document.getElementById("engine-status-text");
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      dot.className = "w-2 h-2 rounded-full bg-tertiary animate-pulse";
      text.innerText = "AI Online";
    } else {
      throw new Error();
    }
  } catch (e) {
    dot.className = "w-2 h-2 rounded-full bg-error";
    text.innerText = "AI Offline";
  }
}

// ── Sound Preview & AI Style Modal ──────────────────────────────────────────
function previewSound(sfxPath, event) {
  if (event) event.stopPropagation();
  state.previewAudio.src = "/" + sfxPath.replace(/^\//, "");
  state.previewAudio.play().catch(() => {});
}
const previewPresetSound = previewSound; // Backwards compatibility alias

function openStyleDetailsModal() {
  const modal = document.getElementById("ai-style-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
}

function closeStyleDetailsModal() {
  const modal = document.getElementById("ai-style-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

// ── Drag & Drop Handlers ────────────────────────────────────────────────────
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("border-primary", "bg-primary/10");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("border-primary", "bg-primary/10");
}

function handleVideoDrop(e) {
  e.preventDefault();
  handleDragLeave(e);
  if (e.dataTransfer.files[0]) {
    setVideoFile(e.dataTransfer.files[0]);
  }
}

function onVideoFileSelected(e) {
  if (e.target.files[0]) {
    setVideoFile(e.target.files[0]);
  }
}

function setVideoFile(file) {
  state.videoFile = file;
  document.getElementById("video-drop-empty").classList.add("hidden");
  document.getElementById("video-drop-filled").classList.remove("hidden");
  document.getElementById("video-filename-text").innerText = file.name;
  document.getElementById("video-size-badge").innerText = (file.size / (1024 * 1024)).toFixed(1) + " MB";

  const videoElem = document.createElement("video");
  videoElem.preload = "metadata";
  // Revoke any previous object URL before creating a new one
  if (state._videoObjectUrl) URL.revokeObjectURL(state._videoObjectUrl);
  state._videoObjectUrl = URL.createObjectURL(file);
  videoElem.src = state._videoObjectUrl;
  videoElem.onloadedmetadata = () => {
    state.videoDuration = videoElem.duration || 60;
    document.getElementById("video-dur-badge").innerText = videoElem.duration.toFixed(1) + "s";
  };
}

function clearSelectedVideo(e) {
  if (e) e.stopPropagation();
  // Release the blob URL to prevent memory leak
  if (state._videoObjectUrl) {
    URL.revokeObjectURL(state._videoObjectUrl);
    state._videoObjectUrl = null;
  }
  state.videoFile = null;
  document.getElementById("video-file-input").value = "";
  document.getElementById("video-drop-empty").classList.remove("hidden");
  document.getElementById("video-drop-filled").classList.add("hidden");
}

function handleSrtDrop(e) {
  e.preventDefault();
  handleDragLeave(e);
  if (e.dataTransfer.files[0]) {
    setSrtFile(e.dataTransfer.files[0]);
  }
}

function onSrtFileSelected(e) {
  if (e.target.files[0]) {
    setSrtFile(e.target.files[0]);
  }
}

function setSrtFile(file) {
  state.srtFile = file;
  document.getElementById("srt-drop-empty").classList.add("hidden");
  document.getElementById("srt-drop-filled").classList.remove("hidden");
  document.getElementById("srt-filename-text").innerText = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = (e.target?.result || "").toString();
    const matches = text.match(/(?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3}\s*-->\s*(?:\d{1,2}:)?\d{2}:\d{2}[,\.]\d{1,3}/g);
    const count = matches ? matches.length : text.split(/\n\s*\n/).length;
    document.getElementById("srt-captions-count").innerText = `${count} Captions Detected`;
  };
  reader.readAsText(file);
}

function clearSelectedSrt(e) {
  if (e) e.stopPropagation();
  state.srtFile = null;
  document.getElementById("srt-file-input").value = "";
  document.getElementById("srt-drop-empty").classList.remove("hidden");
  document.getElementById("srt-drop-filled").classList.add("hidden");
}

function setScriptMode(mode) {
  state.scriptMode = mode;
  document.getElementById("tab-script-upload").className = mode === "upload"
    ? "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-primary-container text-on-primary-container shadow-xs font-label-mono"
    : "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-on-surface-variant hover:text-on-surface font-label-mono";

  document.getElementById("tab-script-transcribe").className = mode === "transcribe"
    ? "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-secondary-container text-on-secondary-container shadow-xs font-label-mono"
    : "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-on-surface-variant hover:text-on-surface font-label-mono";
}

function loadSampleScriptDemo() {
  const sampleSRT = `1\n00:00:01,000 --> 00:00:04,500\nWhat if I told you that everything you remember was a simulation?\n\n2\n00:00:05,000 --> 00:00:08,200\nIn reality, the Mandela Effect was never supposed to happen.\n\n3\n00:00:09,000 --> 00:00:12,800\nStage 2: Years later, the entire timeline began to glitch.\n\n4\n00:00:13,500 --> 00:00:16,800\nFinally, that is when everything changed forever.\n`;
  const blob = new Blob([sampleSRT], { type: "text/plain" });
  const file = new File([blob], "demo_narration.srt", { type: "text/plain" });
  setSrtFile(file);
  setScriptMode("upload");
  showToast("Loaded sample demo script!");
}

// ── 1-Click Interactive Demo ────────────────────────────────────────────────
function launchInteractiveDemo() {
  const btn = document.getElementById("btn-quick-demo");
  btn.innerText = "⏳ Generating Demo...";
  btn.disabled = true;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      ctx.fillStyle = "#131314";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(192, 193, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      const pulse = Math.sin(frame * 0.15) * 30;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 80 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(192, 193, 255, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "#c0c1ff";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 32px 'Geist', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AutoAudio Studio Interactive Demo", canvas.width / 2, canvas.height / 2 - 120);
      ctx.font = "18px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#c0c1ff";
      ctx.fillText(`Frame ${frame} • AI Sound Design Test Sequence`, canvas.width / 2, canvas.height / 2 + 130);
    }, 1000 / 30);

    recorder.start();
    setTimeout(() => {
      clearInterval(interval);
      recorder.stop();
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const demoVideo = new File([blob], "interactive_demo_video.mp4", { type: "video/mp4" });
        setVideoFile(demoVideo);
        loadSampleScriptDemo();
        btn.innerText = "⚡ Quick Demo (1-Click)";
        btn.disabled = false;
        showToast("Quick Demo media created! Click 'Generate Sound Design'.");
      };
    }, 2000);
  } catch (e) {
    btn.innerText = "⚡ Quick Demo (1-Click)";
    btn.disabled = false;
    loadSampleScriptDemo();
  }
}

// ── Upload & Analysis Execution ─────────────────────────────────────────────
let analysisSimulationInterval = null;

async function startAnalysisWorkflow() {
  if (!state.videoFile) {
    showError("Please provide a video file first.");
    return;
  }

  hideError();
  switchView("analysis");
  document.getElementById("analysis-filename-label").innerText = state.videoFile.name;
  updateAnalysisProgress(15, "Uploading video & script...");

  // Start animated subtitle stream simulation
  renderAnalysisStream();

  try {
    const formData = new FormData();
    formData.append("video", state.videoFile);
    if (state.scriptMode === "upload" && state.srtFile) {
      formData.append("srt", state.srtFile);
    }

    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }

    const { job_id } = await uploadRes.json();
    state.jobId = job_id;
    updateAnalysisProgress(40, "AI analyzing script style & acoustic palette...");

    const analyzeRes = await fetch(`/api/analyze/${job_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.settings),
    });

    if (!analyzeRes.ok) {
      const err = await analyzeRes.json().catch(() => ({ detail: "Analysis failed" }));
      throw new Error(err.detail || "Analysis failed");
    }

    const timelineData = await analyzeRes.json();

    if (timelineData.ai_style) {
      const badge = document.getElementById("analysis-style-text");
      if (badge) {
        badge.innerText = `AI Decided: ${timelineData.ai_style.style_name} • ${timelineData.ai_style.mood}`;
      }
    }

    updateAnalysisProgress(100, "Rendering studio timeline...");
    // Clear simulation immediately — do not wait for the transition delay
    clearInterval(analysisSimulationInterval);
    analysisSimulationInterval = null;

    setTimeout(() => {
      loadTimelineIntoStudio(timelineData);
    }, 800);
  } catch (err) {
    clearInterval(analysisSimulationInterval);
    switchView("session");
    showError(err.message || "Failed to analyze video.");
  }
}

function updateAnalysisProgress(percent, label) {
  document.getElementById("analysis-progress-bar").style.width = percent + "%";
  document.getElementById("analysis-progress-text").innerText = percent + "%";
}

function renderAnalysisStream() {
  const streamContainer = document.getElementById("analysis-subtitles-stream");
  const queueContainer = document.getElementById("analysis-events-queue");
  streamContainer.innerHTML = "";
  queueContainer.innerHTML = "";

  const lines = [
    { ts: "00:00:02", text: "What if I told you everything you remember was a simulation?", tag: "QUESTION", sfx: "RISER" },
    { ts: "00:00:06", text: "In reality, the Mandela Effect was never supposed to happen.", tag: "HOOK", sfx: "IMPACT" },
    { ts: "00:00:11", text: "Stage 2: Years later, the entire timeline began to glitch.", tag: "GLITCH", sfx: "GLITCH" },
    { ts: "00:00:16", text: "Suddenly, all data records were wiped without warning.", tag: "REVEAL", sfx: "WHOOSH" },
  ];

  let step = 0;
  analysisSimulationInterval = setInterval(() => {
    if (step < lines.length) {
      const item = lines[step];
      const lineDiv = document.createElement("div");
      lineDiv.className = "p-3 rounded-xl bg-surface-container border border-primary/40 text-on-surface shadow-md animate-in fade-in";
      lineDiv.innerHTML = `
        <div class="flex justify-between items-center mb-1">
          <span class="text-[10px] text-primary font-bold">[${item.ts}]</span>
          <span class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold border border-primary/30 font-label-mono">⚡ ${item.tag}</span>
        </div>
        <p class="font-body-base text-xs">"${item.text}"</p>
      `;
      streamContainer.appendChild(lineDiv);

      const queueDiv = document.createElement("div");
      queueDiv.className = "p-2.5 rounded-xl bg-surface-container border border-outline-variant/15 flex items-center justify-between text-xs animate-in slide-in-from-right";
      queueDiv.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="font-bold text-white">${item.sfx}</span>
          <span class="text-[10px] text-on-surface-variant font-label-mono">${item.ts}</span>
        </div>
        <span class="text-tertiary font-bold font-timecode">98%</span>
      `;
      queueContainer.appendChild(queueDiv);
      step++;
    }
  }, 1200);
}

function abortAnalysis() {
  clearInterval(analysisSimulationInterval);
  switchView("session");
  showToast("Analysis cancelled.");
}

// ── Studio Timeline Loader & Sync ───────────────────────────────────────────
async function loadExistingTimeline(jobId) {
  state.jobId = jobId;
  try {
    const res = await fetch(`/api/analyze/${jobId}`);
    if (res.ok) {
      const data = await res.json();
      loadTimelineIntoStudio(data);
    }
  } catch (e) {}
}

function loadTimelineIntoStudio(data) {
  state.events = data.sfx_events || [];
  state.analyzedSegments = data.analyzed_segments || [];
  state.musicConfig = data.music_config || null;
  state.videoDuration = data.video_duration || 60;
  state.aiStyle = data.ai_style || null;

  // Setup video source — use actual filename returned from the upload
  const video = document.getElementById("studio-video");
  const ext = state.videoFile ? state.videoFile.name.split(".").pop() : "mp4";
  video.src = `/uploads/${state.jobId}/video.${ext}`;

  document.getElementById("project-header-title").innerText = `${state.videoFile?.name || "Job " + state.jobId} — AI Sound Design`;

  // Render AI Style Badges & Details
  if (state.aiStyle) {
    const pill = document.getElementById("ai-style-pill");
    const nameBadge = document.getElementById("ai-style-name-badge");
    if (pill && nameBadge) {
      pill.classList.remove("hidden");
      pill.classList.add("flex");
      nameBadge.innerText = `✨ ${state.aiStyle.style_name}`;
    }

    // Studio Inspector Card
    const studioName = document.getElementById("studio-style-name");
    const studioMood = document.getElementById("studio-style-mood");
    const studioReason = document.getElementById("studio-style-reasoning");
    const studioMusic = document.getElementById("studio-music-int");
    const studioSfx = document.getElementById("studio-sfx-int");
    const studioPacing = document.getElementById("studio-pacing");

    if (studioName) studioName.innerText = state.aiStyle.style_name;
    if (studioMood) studioMood.innerText = state.aiStyle.mood;
    if (studioReason) studioReason.innerText = state.aiStyle.reasoning;
    if (studioMusic) studioMusic.innerText = Math.round(state.aiStyle.music_intensity * 100) + "%";
    if (studioSfx) studioSfx.innerText = Math.round(state.aiStyle.sfx_intensity * 100) + "%";
    if (studioPacing) studioPacing.innerText = state.aiStyle.pacing;

    // Details Modal
    const modalName = document.getElementById("modal-style-name");
    const modalMood = document.getElementById("modal-style-mood");
    const modalTheme = document.getElementById("modal-style-theme");
    const modalReason = document.getElementById("modal-style-reasoning");
    const modalMusic = document.getElementById("modal-music-int");
    const modalSfx = document.getElementById("modal-sfx-int");
    const modalPacing = document.getElementById("modal-pacing");
    const paletteContainer = document.getElementById("modal-palette-tags");

    if (modalName) modalName.innerText = state.aiStyle.style_name;
    if (modalMood) modalMood.innerText = state.aiStyle.mood;
    if (modalTheme) modalTheme.innerText = state.aiStyle.narrative_theme || "Script Dialogue & Narrative";
    if (modalReason) modalReason.innerText = state.aiStyle.reasoning;
    if (modalMusic) modalMusic.innerText = Math.round(state.aiStyle.music_intensity * 100) + "%";
    if (modalSfx) modalSfx.innerText = Math.round(state.aiStyle.sfx_intensity * 100) + "%";
    if (modalPacing) modalPacing.innerText = state.aiStyle.pacing;

    if (paletteContainer && state.aiStyle.acoustic_palette) {
      paletteContainer.innerHTML = state.aiStyle.acoustic_palette.map(
        tag => `<span class="px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/20 font-label-mono text-[10px] text-primary font-bold uppercase">#${tag}</span>`
      ).join("");
    }
  }

  switchView("studio");
  renderTimeline();
}

// ── Video Controls ──────────────────────────────────────────────────────────
function onVideoLoaded() {
  const video = document.getElementById("studio-video");
  if (video.duration) state.videoDuration = video.duration;
  renderTimeline();
}

function onVideoTimeUpdate() {
  const video = document.getElementById("studio-video");
  state.currentTime = video.currentTime;
  updatePlayheadPosition();

  // Update timecode display
  const tc = formatTimecode(state.currentTime);
  document.getElementById("video-timecode-badge").innerText = tc;
  document.getElementById("timeline-ruler-timecode").innerText = tc;
}

function toggleVideoPlay() {
  const video = document.getElementById("studio-video");
  if (video.paused) {
    video.play();
    state.isPlaying = true;
    document.getElementById("transport-play-btn").innerHTML = '<span class="material-symbols-outlined text-[18px]">pause</span>';
    document.getElementById("video-center-play-btn").classList.add("opacity-0", "pointer-events-none");

    // Continuous looping music playback
    if (state.musicConfig?.track_path) {
      const musicPath = "/" + state.musicConfig.track_path.replace(/^\//, "");
      if (state.musicAudio.src !== window.location.origin + musicPath) {
        state.musicAudio.src = musicPath;
      }
      state.musicAudio.loop = true;
      state.musicAudio.volume = Math.max(0.01, Math.min(1.0, (state.musicConfig.volume || 0.14) * 0.8));
      if (state.musicAudio.duration) {
        state.musicAudio.currentTime = state.currentTime % state.musicAudio.duration;
      }
      state.musicAudio.play().catch(() => {});
    }
  } else {
    video.pause();
    state.isPlaying = false;
    document.getElementById("transport-play-btn").innerHTML = '<span class="material-symbols-outlined text-[18px]">play_arrow</span>';
    document.getElementById("video-center-play-btn").classList.remove("opacity-0", "pointer-events-none");
    if (state.musicAudio) state.musicAudio.pause();
  }
}

function seekVideo(seconds) {
  const video = document.getElementById("studio-video");
  video.currentTime = Math.max(0, Math.min(seconds, state.videoDuration));
  if (state.musicAudio && state.musicAudio.duration) {
    state.musicAudio.currentTime = video.currentTime % state.musicAudio.duration;
  }
  onVideoTimeUpdate();
}

function skipVideo(offset) {
  const video = document.getElementById("studio-video");
  seekVideo(video.currentTime + offset);
}

function toggleVideoMute() {
  const video = document.getElementById("studio-video");
  video.muted = !video.muted;
  document.getElementById("btn-video-mute").innerHTML = video.muted
    ? '<span class="material-symbols-outlined text-[18px] text-error">volume_off</span>'
    : '<span class="material-symbols-outlined text-[18px]">volume_up</span>';
}

function setVideoSpeed(rate) {
  const video = document.getElementById("studio-video");
  video.playbackRate = parseFloat(rate);
}

function toggleVideoFullscreen() {
  const video = document.getElementById("studio-video");
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    video.requestFullscreen().catch(() => {});
  }
}

// ── Timeline Rendering & Interaction ────────────────────────────────────────
function renderTimeline() {
  const rulerScale = document.getElementById("timeline-ruler-scale");
  const laneNarration = document.getElementById("lane-narration");
  const laneSfx = document.getElementById("lane-sfx");
  const laneMusic = document.getElementById("lane-music");

  rulerScale.innerHTML = "";
  laneNarration.innerHTML = "";
  laneSfx.innerHTML = "";
  laneMusic.innerHTML = "";

  const pxPerSec = 48 * state.zoom;
  const totalWidth = Math.max(800, state.videoDuration * pxPerSec);

  document.getElementById("timeline-lanes-container").style.width = totalWidth + "px";

  // 1. Render Ruler markings
  for (let s = 0; s <= state.videoDuration; s += 5) {
    const mark = document.createElement("span");
    mark.className = "absolute top-1 text-[9px] font-label-mono text-on-surface-variant/70";
    mark.style.left = `${s * pxPerSec}px`;
    mark.innerText = formatTimecodeShort(s);
    rulerScale.appendChild(mark);
  }

  // 2. Render Narration Segments
  state.analyzedSegments.forEach((seg) => {
    const pill = document.createElement("div");
    const left = seg.start_sec * pxPerSec;
    const width = Math.max(40, (seg.end_sec - seg.start_sec) * pxPerSec);
    pill.className = "absolute top-2 bottom-2 rounded-lg bg-secondary/15 border border-secondary/30 px-2 flex items-center justify-between text-[11px] font-bold text-secondary truncate overflow-hidden cursor-pointer hover:bg-secondary/25 transition-colors";
    pill.style.left = `${left}px`;
    pill.style.width = `${width}px`;
    pill.innerHTML = `<span>${seg.tag !== 'NONE' ? '⚡ ' + seg.tag : 'Speech'}</span>`;
    pill.onclick = () => seekVideo(seg.start_sec);
    laneNarration.appendChild(pill);
  });

  // 3. Render SFX Clips
  state.events.forEach((ev) => {
    const clip = document.createElement("div");
    const left = ev.timestamp * pxPerSec;
    const isSelected = state.selectedEventId === ev.id;

    clip.className = `absolute top-1.5 bottom-1.5 rounded-lg px-2.5 flex items-center justify-between text-xs font-bold cursor-pointer transition-all ${
      isSelected
        ? "bg-primary text-on-primary ring-2 ring-white shadow-lg z-20"
        : "bg-primary-container/80 hover:bg-primary text-on-primary-container hover:text-on-primary border border-primary/40 z-10"
    }`;
    clip.style.left = `${left}px`;
    // Width reflects the event's actual trimmed duration scaled to current zoom
    const clipWidthPx = ev.duration
      ? Math.max(40, ev.duration * pxPerSec)
      : 110;  // fallback for manually-inserted events without duration
    clip.style.width = `${clipWidthPx}px`;
    clip.innerHTML = `
      <span class="truncate mr-1 font-label-mono text-[10px]">${ev.label || ev.sfx_type.toUpperCase()}</span>
      <span class="text-[9px] font-timecode opacity-80">${(ev.volume * 100).toFixed(0)}%</span>
    `;

    // Click to select
    clip.onclick = (e) => {
      e.stopPropagation();
      selectClip(ev.id);
    };

    // Drag to retime
    clip.onmousedown = (e) => {
      e.stopPropagation();
      const startX = e.clientX;
      const initialTs = ev.timestamp;

      function onMouseMove(moveEv) {
        const deltaX = moveEv.clientX - startX;
        let newTs = Math.max(0, Math.min(initialTs + deltaX / pxPerSec, state.videoDuration));
        if (state.snapEnabled) newTs = Math.round(newTs * 2) / 2;
        ev.timestamp = newTs;
        clip.style.left = `${newTs * pxPerSec}px`;
        if (state.selectedEventId === ev.id) {
          document.getElementById("insp-pos-input").value = newTs.toFixed(2);
        }
      }

      function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        seekVideo(ev.timestamp);
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    laneSfx.appendChild(clip);
  });

  // 4. Render Sequential Music Clips
  const musicClips = state.musicConfig?.clips || [];
  if (musicClips.length > 0) {
    musicClips.forEach((clip) => {
      const left = clip.start_sec * pxPerSec;
      const width = Math.max(25, (clip.end_sec - clip.start_sec) * pxPerSec);
      const isCut = clip.end_sec >= state.videoDuration;

      const clipElem = document.createElement("div");
      clipElem.className = `absolute top-1.5 bottom-1.5 rounded-lg bg-tertiary/20 hover:bg-tertiary/35 border border-tertiary/40 px-2 flex items-center justify-between text-[10px] font-bold text-tertiary truncate transition-all cursor-pointer ${
        isCut ? "border-dashed border-tertiary/80 ring-1 ring-tertiary/50" : ""
      }`;
      clipElem.style.left = `${left}px`;
      clipElem.style.width = `${width}px`;
      clipElem.innerHTML = `
        <span class="truncate mr-1 font-label-mono">🎵 ${clip.title}</span>
        <span class="font-timecode text-[9px] opacity-80">${clip.duration.toFixed(1)}s${isCut ? " ✂ CUT" : ""}</span>
      `;
      clipElem.onclick = () => seekVideo(clip.start_sec);
      laneMusic.appendChild(clipElem);
    });
  } else {
    const musicBed = document.createElement("div");
    musicBed.className = "absolute inset-y-1.5 left-0 right-0 rounded-lg bg-tertiary/15 border border-tertiary/30 px-3 flex items-center justify-between text-[11px] font-bold text-tertiary";
    musicBed.innerHTML = `
      <span>🎵 ${state.musicConfig?.mood || "Ambient Tension Soundscape"}</span>
      <span class="font-timecode">${((state.musicConfig?.volume || 0.12) * 100).toFixed(0)}% Bed</span>
    `;
    laneMusic.appendChild(musicBed);
  }

  updatePlayheadPosition();
}

function updatePlayheadPosition() {
  const pxPerSec = 48 * state.zoom;
  const playhead = document.getElementById("timeline-playhead-line");
  if (playhead) {
    playhead.style.left = `${state.currentTime * pxPerSec}px`;
  }
}

function onTimelineRulerClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pxPerSec = 48 * state.zoom;
  seekVideo(clickX / pxPerSec);
}

function onTimelineLanesClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pxPerSec = 48 * state.zoom;
  seekVideo(clickX / pxPerSec);
}

function onTimelineZoomChange(val) {
  state.zoom = parseFloat(val);
  renderTimeline();
}

function toggleSnap() {
  state.snapEnabled = !state.snapEnabled;
  document.getElementById("btn-timeline-snap").classList.toggle("text-primary", state.snapEnabled);
  document.getElementById("btn-timeline-snap").classList.toggle("text-on-surface-variant", !state.snapEnabled);
  showToast(state.snapEnabled ? "Magnetic Snap: ON" : "Magnetic Snap: OFF");
}

// ── Inspector Logic ─────────────────────────────────────────────────────────
function selectClip(id) {
  state.selectedEventId = id;
  renderTimeline();

  const ev = state.events.find((x) => x.id === id);
  if (!ev) return;

  document.getElementById("inspector-content-empty").classList.add("hidden");
  document.getElementById("inspector-content-filled").classList.remove("hidden");
  document.getElementById("inspector-badge-type").innerText = ev.sfx_type.toUpperCase();
  document.getElementById("insp-label-input").value = ev.label || ev.sfx_type.toUpperCase();
  document.getElementById("insp-pos-input").value = ev.timestamp.toFixed(2);
  document.getElementById("insp-gain-slider").value = ev.volume;
  document.getElementById("insp-gain-text").innerText = ev.volume.toFixed(2);
  document.getElementById("insp-filename-text").innerText = ev.sfx_path.split("/").pop();
  document.getElementById("insp-cue-text").innerText = ev.text_snippet || "Manual Cue Placement";
}

function onInspectorUpdate() {
  const ev = state.events.find((x) => x.id === state.selectedEventId);
  if (!ev) return;
  ev.label = document.getElementById("insp-label-input").value;
  ev.timestamp = parseFloat(document.getElementById("insp-pos-input").value) || 0;
  renderTimeline();
}

function onInspectorGainChange(val) {
  const ev = state.events.find((x) => x.id === state.selectedEventId);
  if (!ev) return;
  ev.volume = parseFloat(val);
  document.getElementById("insp-gain-text").innerText = ev.volume.toFixed(2);
  renderTimeline();
}

function auditionInspectorSound() {
  const ev = state.events.find((x) => x.id === state.selectedEventId);
  if (!ev) return;
  previewSound(ev.sfx_path);
}

function deleteInspectorClip() {
  if (!state.selectedEventId) return;
  state.events = state.events.filter((x) => x.id !== state.selectedEventId);
  state.selectedEventId = null;
  document.getElementById("inspector-content-empty").classList.remove("hidden");
  document.getElementById("inspector-content-filled").classList.add("hidden");
  renderTimeline();
  showToast("Sound effect deleted");
}

// ── Sound Library Drawer ────────────────────────────────────────────────────
async function loadSfxCatalog() {
  try {
    const res = await fetch("/api/library/sfx");
    if (res.ok) {
      state.sfxLibrary = await res.json();
      renderSoundLibrary();
    }
  } catch (e) {}
}

function toggleLibraryDrawer() {
  const drawer = document.getElementById("sound-library-drawer");
  drawer.classList.toggle("translate-x-full");
}

function filterCategory(cat) {
  state.activeLibraryCategory = cat;
  document.querySelectorAll(".cat-pill").forEach((pill) => {
    const isActive = pill.innerText.toLowerCase() === cat || (cat === "all" && pill.innerText === "All");
    pill.className = isActive
      ? "cat-pill px-3 py-1 rounded-full bg-primary text-on-primary font-label-mono text-[10px] font-bold whitespace-nowrap shadow-sm"
      : "cat-pill px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest font-label-mono text-[10px] font-bold whitespace-nowrap";
  });
  renderSoundLibrary();
}

function filterSoundLibrary() {
  renderSoundLibrary();
}

function renderSoundLibrary() {
  const list = document.getElementById("library-items-list");
  list.innerHTML = "";

  const search = (document.getElementById("library-search-input")?.value || "").toLowerCase();
  const cat = state.activeLibraryCategory;

  const filtered = state.sfxLibrary.filter((item) => {
    const matchesCat = cat === "all" || item.type === cat;
    const matchesSearch = !search || item.filename.toLowerCase().includes(search) || item.type.toLowerCase().includes(search);
    return matchesCat && matchesSearch;
  });

  filtered.forEach((item) => {
    const path = `assets/sfx/${item.folder}/${item.filename}`;
    const card = document.createElement("div");
    card.className = "p-3 rounded-xl border border-outline-variant/10 bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between gap-3 group";
    card.innerHTML = `
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <button type="button" onclick="previewSound('${path}', event)" class="w-8 h-8 rounded-full bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center flex-shrink-0 transition-all">
          <span class="material-symbols-outlined text-[16px]">play_arrow</span>
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">${item.filename}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-[9px] font-label-mono uppercase px-1.5 py-0.5 rounded bg-primary-container/20 text-primary">${item.type}</span>
            <span class="text-[9px] font-timecode text-on-surface-variant">${item.duration}s</span>
          </div>
        </div>
      </div>
      <button onclick="insertSoundAtPlayhead('${path}', '${item.type}', '${item.filename}')" class="px-2.5 py-1 text-[10px] font-bold font-label-mono bg-surface-container-lowest border border-outline-variant/20 hover:bg-primary hover:text-on-primary text-on-surface rounded transition-all cursor-pointer">
        + INSERT
      </button>
    `;
    list.appendChild(card);
  });
}

function insertSoundAtPlayhead(path, type, filename) {
  const newEv = {
    id: "sfx-" + Math.random().toString(36).substr(2, 9),
    timestamp: parseFloat(state.currentTime.toFixed(2)),
    tag: type.toUpperCase(),
    sfx_type: type,
    sfx_path: path,
    volume: 0.75,
    label: type.toUpperCase(),
    text_snippet: `Custom Placement: ${filename.slice(0, 20)}`,
    duration: null,  // renderer will play full file when null
  };

  state.events.push(newEv);
  state.events.sort((a, b) => a.timestamp - b.timestamp);
  renderTimeline();
  selectClip(newEv.id);
  previewSound(path);
  showToast(`Inserted ${type.toUpperCase()} at ${state.currentTime.toFixed(2)}s`);
}

// ── Export & Mixdown Dialog ─────────────────────────────────────────────────
function openMixdownModal() {
  const modal = document.getElementById("mixdown-modal");
  const noJobBanner = document.getElementById("export-no-job-banner");
  const startBtn = document.getElementById("btn-export-start");
  const downloadBtn = document.getElementById("btn-export-download");
  const progressBox = document.getElementById("export-progress-box");

  modal.classList.remove("hidden");
  startBtn.classList.remove("hidden");
  downloadBtn.classList.add("hidden");
  progressBox.classList.add("hidden");

  // Check if active job exists
  if (!state.jobId) {
    if (noJobBanner) noJobBanner.classList.remove("hidden");
    startBtn.disabled = true;
    startBtn.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    if (noJobBanner) noJobBanner.classList.add("hidden");
    startBtn.disabled = false;
    startBtn.classList.remove("opacity-50", "cursor-not-allowed");

    // Populate stem track labels
    const dialLabel = document.getElementById("mix-dialogue-name");
    const musicLabel = document.getElementById("mix-music-name");
    const sfxLabel = document.getElementById("mix-sfx-name");

    if (dialLabel) {
      dialLabel.innerText = state.videoFile ? state.videoFile.name : "Dialogue / Speech Audio";
    }
    if (musicLabel) {
      if (state.musicConfig && state.musicConfig.track_path) {
        const parts = state.musicConfig.track_path.split("/");
        musicLabel.innerText = parts[parts.length - 1].replace(/\.(wav|mp3|ogg)$/i, "");
      } else {
        musicLabel.innerText = "Ambient Score";
      }
    }
    if (sfxLabel) {
      sfxLabel.innerText = `${state.events.length} Sound Effects Bus`;
    }

    // Update estimated file size
    updateExportSizeEstimation();
  }
}

function closeMixdownModal() {
  document.getElementById("mixdown-modal").classList.add("hidden");
}

function updateExportSizeEstimation() {
  const dur = state.videoDuration || 30;
  const is4K = state.exportResolution === "4K";
  const estMB = is4K ? Math.max(20, Math.round(dur * 2.2)) : Math.max(8, Math.round(dur * 0.75));
  const sizeElem = document.getElementById("export-est-size");
  if (sizeElem) sizeElem.innerText = `${estMB} MB`;
}

function setExportResolution(res) {
  state.exportResolution = res;
  document.getElementById("res-1080p").className = res === "1080p"
    ? "py-1.5 rounded-lg text-xs font-bold bg-primary-container text-on-primary-container font-label-mono"
    : "py-1.5 rounded-lg text-xs font-bold bg-surface-container text-on-surface-variant font-label-mono";

  document.getElementById("res-4k").className = res === "4K"
    ? "py-1.5 rounded-lg text-xs font-bold bg-primary-container text-on-primary-container font-label-mono"
    : "py-1.5 rounded-lg text-xs font-bold bg-surface-container text-on-surface-variant font-label-mono";

  updateExportSizeEstimation();
}

async function triggerFFmpegExport() {
  if (!state.jobId) {
    showToast("Please analyze a video before exporting.", "error");
    return;
  }

  const startBtn = document.getElementById("btn-export-start");
  const progressBox = document.getElementById("export-progress-box");
  const progressBar = document.getElementById("export-progress-bar");
  const progressText = document.getElementById("export-progress-percent");
  const stageText = document.getElementById("export-stage-text");
  const downloadBtn = document.getElementById("btn-export-download");

  startBtn.classList.add("hidden");
  progressBox.classList.remove("hidden");
  stageText.classList.remove("text-error");

  // Read stem bus mixer sliders
  const dialogueVol = (parseFloat(document.getElementById("mix-dialogue-vol")?.value || 100)) / 100;
  const musicVol = (parseFloat(document.getElementById("mix-music-vol")?.value || 100)) / 100;
  const sfxVol = (parseFloat(document.getElementById("mix-sfx-vol")?.value || 100)) / 100;

  // Smooth stage animation
  let currentPct = 15;
  progressBar.style.width = currentPct + "%";
  progressText.innerText = currentPct + "%";
  stageText.innerText = "Applying sample-accurate audio delays & stem levels...";

  const progressInterval = setInterval(() => {
    if (currentPct < 85) {
      currentPct += Math.floor(Math.random() * 12) + 6;
      if (currentPct > 85) currentPct = 85;
      progressBar.style.width = currentPct + "%";
      progressText.innerText = currentPct + "%";

      if (currentPct >= 35 && currentPct < 65) {
        stageText.innerText = "Summing multi-stem filtergraph & ducking buses...";
      } else if (currentPct >= 65) {
        stageText.innerText = "Encoding high-definition H.264 video & AAC audio...";
      }
    }
  }, 400);

  const exportPayload = {
    sfx_events: state.events,
    music_config: state.musicConfig,
    music_enabled: state.settings.music_enabled,
    sfx_enabled: state.settings.sfx_enabled,
    dialogue_volume: dialogueVol,
    music_volume: musicVol,
    sfx_volume: sfxVol,
    resolution: state.exportResolution || "1080p",
  };

  try {
    const res = await fetch(`/api/export/${state.jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportPayload),
    });

    clearInterval(progressInterval);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "FFmpeg render failed on backend." }));
      throw new Error(err.detail || "FFmpeg render failed on backend.");
    }

    progressBar.style.width = "100%";
    progressText.innerText = "100%";
    stageText.innerText = "Sound design render complete!";

    const blob = await res.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const outFilename = state.videoFile?.name
      ? state.videoFile.name.replace(/\.[^/.]+$/, "") + "_auto_audio.mp4"
      : `auto_audio_${state.jobId.slice(0, 8)}.mp4`;

    downloadBtn.href = downloadUrl;
    downloadBtn.download = outFilename;
    downloadBtn.classList.remove("hidden");

    // Auto-trigger download
    downloadBtn.click();
    showToast("Export completed! Video downloaded successfully.", "success");
  } catch (err) {
    clearInterval(progressInterval);
    stageText.innerText = "Export failed: " + err.message;
    stageText.classList.add("text-error");
    startBtn.classList.remove("hidden");
    showToast(err.message, "error");
  }
}

// ── Shortcuts Modal ─────────────────────────────────────────────────────────
function openShortcutsModal() {
  document.getElementById("shortcuts-modal").classList.remove("hidden");
}

function closeShortcutsModal() {
  document.getElementById("shortcuts-modal").classList.add("hidden");
}

function setupKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.code === "Space") {
      e.preventDefault();
      toggleVideoPlay();
    } else if (e.code === "ArrowLeft" || e.key.toLowerCase() === "j") {
      e.preventDefault();
      skipVideo(-5);
    } else if ((e.code === "ArrowRight" || e.key.toLowerCase() === "l") && !e.shiftKey) {
      e.preventDefault();
      skipVideo(5);
    } else if (e.key.toLowerCase() === "m") {
      e.preventDefault();
      toggleVideoMute();
    } else if (e.key.toLowerCase() === "l" && e.shiftKey) {
      e.preventDefault();
      toggleLibraryDrawer();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (state.selectedEventId) {
        e.preventDefault();
        deleteInspectorClip();
      }
    } else if (e.key === "?") {
      e.preventDefault();
      openShortcutsModal();
    }
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatTimecode(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function formatTimecodeShort(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function showToast(msg) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "px-4 py-2.5 rounded-xl bg-surface-container-high border border-primary/30 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200 pointer-events-auto";
  toast.innerHTML = `<span class="material-symbols-outlined text-[16px] text-tertiary">check_circle</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showError(msg) {
  const alert = document.getElementById("session-error-alert");
  const text = document.getElementById("session-error-text");
  text.innerText = msg;
  alert.classList.remove("hidden");
}

function hideError() {
  document.getElementById("session-error-alert")?.classList.add("hidden");
}
