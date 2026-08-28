---
name: Obsidian Sonic Lab
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  timecode:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  track-height: 52px
  header-width: 144px
  ruler-height: 28px
  drawer-width: 420px
---

## Brand & Style

The design system is a high-precision, cybernetic workspace tailored for professional audio engineers and AI-assisted creators. It balances the raw utility of a technical post-production suite with the sophisticated aesthetics of modern glassmorphism. The brand personality is focused, deterministic, and futuristic—evoking a sense of absolute control over complex data.

**Visual Narrative:**
- **Theme:** "Frosted Charcoal DAW"—a deep, immersive dark mode environment that minimizes eye strain during long editing sessions.
- **Style:** Glassmorphism meets Technical Minimalism. Surfaces utilize backdrop blurs and hairline borders to create depth without visual clutter. 
- **Emotional Response:** Professional, high-tech, reliable, and fluid. The UI should feel like a premium physical console translated into a digital, multi-layered glass interface.

## Colors

The palette is built on a foundation of "Studio Obsidian" neutrals, punctuated by high-vibrancy functional accents that categorize audio types instantly.

- **Foundational Neutrals:** Use `#0B0B0C` for high-contrast drawers and rulers, `#1E1E1E` for the primary workspace canvas, and `#18181B` for the timeline viewport to create a recessed, focused area.
- **Functional Accents:**
    - **Electric Blue (#3B82F6):** SFX and Action triggers.
    - **Soft Purple (#A855F7):** Narration, Voice, and AI transcription.
    - **Emerald Green (#10B981):** Ambient beds, Music tracks, and system health.
    - **Amber (#F59E0B):** Highlights, hooks, and user-defined markers.
    - **Laser Red (#F43F5E):** The playhead and destructive actions.
- **Glass Surfaces:** Translucent layers should use `rgba(255, 255, 255, 0.03)` with a `12px` backdrop blur and `#3E3E42` hairline borders.

## Typography

Typography is treated as a precision instrument. We employ a tri-font system:
1. **Geist:** Used for high-level display and headlines to reinforce a technical, modern aesthetic.
2. **Inter:** The primary workhorse for all UI labels, inputs, and descriptions, chosen for its exceptional legibility at small sizes.
3. **JetBrains Mono:** Reserved for data-heavy elements including timecodes, frequency values, file extensions, and timeline ruler ticks.

**Scaling & Contrast:**
Maintain high contrast between labels and backgrounds. Use `uppercase` with increased letter-spacing for `label-mono` roles to distinguish them from standard body text.

## Layout & Spacing

This design system uses a **Fluid Studio Grid** model. The interface is divided into functional zones that stretch to fill the viewport, prioritizing the timeline.

- **Grid Model:** 4px baseline unit. All spacing and sizing must be increments of 4px.
- **The DAW Timeline:** 
    - **Track Headers:** Fixed width (144px) on the left.
    - **Track Lanes:** Minimum height of 52px for high-density vertical stacking.
    - **Ruler:** Fixed 28px height at the top of the viewport.
- **Breakpoints:**
    - **Mobile:** Not supported for the full DAW; viewports under 1024px reflow to a simplified "Preview & Review" mode.
    - **Desktop (1440px+):** Full multi-pane layout with persistent Sound Library drawer.
- **Margins:** 16px global safe area for control panels; 0px for the timeline to maximize "edge-to-edge" editing precision.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Layer 0 (Canvas):** `#1E1E1E` - The base of the application.
- **Layer 1 (Recessed Viewport):** `#18181B` - The timeline area, appearing "sunken" into the canvas.
- **Layer 2 (Glass Panels):** Floating panels and cards using `backdrop-filter: blur(12px)` and a subtle `1px` border of `rgba(255, 255, 255, 0.08)`.
- **Layer 3 (Overlays):** Modals and the Sound Library drawer use the darkest neutral (`#0B0B0C`) with a high-intensity blur to isolate them from the workspace.
- **Active States:** Selected clips or active inputs should emit a subtle glow (e.g., `box-shadow: 0 0 12px rgba(99, 102, 241, 0.4)`) instead of becoming physically elevated.

## Shapes

The shape language is "Soft Technical." We avoid aggressive roundness to maintain the professional, space-efficient feel of a DAW.

- **Standard Radius:** 8px (`rounded-md`) for buttons, input fields, and audio clips.
- **Panel Radius:** 12px-16px (`rounded-lg/xl`) for larger glass containers and modal windows.
- **Interactive Elements:** Checkboxes and radio buttons use a 4px radius (`rounded-sm`) to keep them feeling like precision hardware toggles.
- **Exceptions:** The Playhead handle is a geometric triangle (clip-path) for maximum precision.

## Components

- **Buttons:** 
    - *Primary:* Gradient fills (`#7C3AED` to `#6366F1`) with white text. 
    - *Studio (Secondary):* Glass background with `#3E3E42` border.
- **Audio Clips:** Use background tints (18% opacity of the accent color) and a solid 1px border of the same accent. Waveforms are rendered in high-contrast versions of the accent color.
- **The Playhead:** A 2px solid `#F43F5E` line with a `box-shadow` laser-glow effect.
- **Sliders:** Slim 4px tracks. The "thumb" is a 16px white circle that blooms with an Indigo glow on hover.
- **Inputs:** Dark, recessed fills (`#0B0B0C`) with `JetBrains Mono` for numerical values.
- **Chips/Tags:** Small, pill-shaped markers for SFX categories (Impact, Glitch, etc.), using the domain-specific color palette with uppercase mono labels.
- **Timeline Ruler:** Features sub-second tick marks every 4px, with timestamps every 48px.