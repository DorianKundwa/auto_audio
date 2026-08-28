# Auto Audio - AI Sound Design Knowledge Base & Catalog Reference

> This document serves as the master semantic guide and scoring manual for AI prompt injection, rule-based heuristics, and automated audio curation.

## Table of Contents
1. [Sound Design Scoring Principles](#1-sound-design-scoring-principles)
2. [SFX Functional Categories & Cue Triggers](#2-sfx-functional-categories--cue-triggers)
3. [Background Music Moods & Dynamic Ducking](#3-background-music-moods--dynamic-ducking)
4. [Complete Sound Effects Catalog (103 Assets)](#4-complete-sound-effects-catalog-103-assets)
5. [Complete Music Score Catalog (30 Assets)](#5-complete-music-score-catalog-30-assets)

---
## 1. Sound Design Scoring Principles

The Auto Audio engine adheres to four foundational principles of cinematic sound design for video:
- **Punctuation Over Clutter**: Sound effects should emphasize critical narrative beats (Hooks, Reveals, Transitions, Punchlines). Non-critical dialogue should remain clean.
- **Frequency Separation**: Background score resides predominantly in the low/mid spectrum to prevent clashing with human speech frequencies (1kHz - 4kHz).
- **Dynamic Ducking**: When a major impact or boom fires, music is ducked by ~6dB for 600-1200ms to maximize perceived loudness and shock value.
- **Anticipation & Release**: Risers build tension right before a reveal; Booms/Impacts release that tension at the exact moment of payoff.

---
## 2. SFX Functional Categories & Cue Triggers

| Category | Dramatic Function | Acoustic Profile | Optimal Volume | Key Triggers |
| :--- | :--- | :--- | :---: | :--- |
| **BOOMS** | Subsonic climax, catastrophic event, or profound plot revelation | Deep low-frequency sub-bass (<80Hz) with resonant ... | 65% - 95% | `finally`, `everything changed`, `the explosion`, `catastrophe` |
| **IMPACTS** | Sharp narrative punctuation, sudden twist, visual smash cut, or intense statement | Fast transient attack with metallic, organic, or b... | 55% - 85% | `never happened`, `the truth is`, `actually`, `smash cut` |
| **RISERS** | Building suspense, tension crescendo, pre-hook anticipation, or countdown | Ascending pitch sweep, vaporous drone swell, or rh... | 45% - 75% | `what if`, `leading up to`, `getting closer`, `watch this` |
| **GLITCHES** | Digital anomaly, simulation theory, Mandela effect, sci-fi distortion, or error | Granular bitcrushed artifacts, robotic stutter, el... | 50% - 75% | `glitch`, `simulation`, `matrix`, `mandela effect` |
| **WHOOSHES** | Fast movement, perspective shift, swipe transition, graphic on-screen zoom | Broadband noise whoosh with Doppler pitch modulati... | 40% - 70% | `meanwhile`, `fast forward`, `zooming in`, `flying across` |
| **TRANSITIONS** | Scene change, chapter heading, flashback sequence, camera flash snapshot | Ethereal shimmer, magic aura, camera shutter snaps... | 45% - 75% | `stage 1`, `stage 2`, `years later`, `flashback` |
| **HEARTBEATS** | Intense anxiety, ticking clock, life-or-death decision, or vital pulse | Muffled rhythmic low-end double thud (lub-dub) or ... | 40% - 70% | `seconds remaining`, `heart racing`, `time is running out`, `fear` |
| **CLICKS** | Tactile UI interaction, mouse click, keyboard typing, mechanical lock switch, or micro foley | Crisp high-transient click / pop with negligible s... | 35% - 65% | `type`, `press`, `button`, `code` |
| **UPBEAT** | Reward chime, financial profit, successful idea, positive notification, or audience applause | Bright harmonic bell chimes, cash register kaching... | 50% - 80% | `made millions`, `cash`, `success`, `brilliant idea` |
| **SILENCE** | Sudden narrative deflation, awkward pause, shocking silence, sub-bass drop out | Low frequency vacuum drop followed by absolute aco... | 30% - 60% | `nothing happened`, `complete silence`, `nobody came`, `empty` |

---
## 3. Background Music Moods & Dynamic Ducking

### Dark Documentary
- **Description**: Slow-tempo atmospheric drone pads, bowed double bass, eerie analog synths, and subtle cinematic tension
- **Emotional Tone**: Unsettling, serious, investigative, suspenseful
- **Ideal Content Genres**: True Crime, Investigative Documentary, Conspiracy / Lore, Dark History
- **Base Mix Volume**: `14%` (calibrated for speech intelligibility)

### Mysterious
- **Description**: Ethereal pads, hypnotic melodic motifs, subtle clockwork ticks, and unresolved harmonic beds
- **Emotional Tone**: Intriguing, curious, mysterious, unexplained
- **Ideal Content Genres**: Sci-Fi Explanations, Mandela Effect, Philosophy / Paradoxes, Tech Mysteries
- **Base Mix Volume**: `16%` (calibrated for speech intelligibility)

### Upbeat
- **Description**: Energetic rhythmic pulses, uplifting synth beds, positive chord progressions, and bright organic textures
- **Emotional Tone**: Inspiring, dynamic, modern, confident, fast-paced
- **Ideal Content Genres**: Tech Tutorials, Business / Case Studies, TikTok Shorts, Product Launches
- **Base Mix Volume**: `18%` (calibrated for speech intelligibility)

---
## 4. Complete Sound Effects Catalog (103 Assets)

### `BOOMS` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `boom_01_01_Boom.wav` | 6.5s | 50% | finally, everything changed, the explosion | 65-95% |
| `boom_02_01_Evolve_Brassy_Swell.wav` | 10.32s | 55% | finally, everything changed, the explosion | 65-95% |
| `boom_03_02_Deep.wav` | 5.0s | 60% | finally, everything changed, the explosion | 65-95% |
| `boom_04_02_Evolve_Brassy_Drop.2.wav` | 13.33s | 65% | finally, everything changed, the explosion | 65-95% |
| `boom_05_03_Evolve_Boom_Brass_D.wav` | 8.0s | 70% | finally, everything changed, the explosion | 65-95% |
| `boom_06_03_Grand_Hit_A.wav` | 6.0s | 75% | finally, everything changed, the explosion | 65-95% |
| `boom_07_04_Evolve_Boom_Feedback_E.wav` | 9.5s | 80% | finally, everything changed, the explosion | 65-95% |
| `boom_08_04_Grand_Hit_B.wav.wav` | 6.0s | 85% | finally, everything changed, the explosion | 65-95% |
| `boom_09_05_Evolve_Boom_Shot.wav` | 6.5s | 90% | finally, everything changed, the explosion | 65-95% |
| `boom_10_06_Evolve_Boom_Hint_of_Metal.wav` | 6.5s | 95% | finally, everything changed, the explosion | 65-95% |
| `boom_11_07_Subsonic_A.wav` | 6.0s | 100% | finally, everything changed, the explosion | 65-95% |
| `boom_12_08_Subsonic_B.wav.wav` | 6.5s | 100% | finally, everything changed, the explosion | 65-95% |

### `CLICKS` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `click_01_Animal_Crossing_Menu.mp3` | 12.2s | 50% | type, press, button | 35-65% |
| `click_02_Bloop_Cartoon_Sound_Effect_(MP3_160K)_(1).mp3` | 3.0s | 55% | type, press, button | 35-65% |
| `click_03_Click_-_Sound_Effect_(HD).mp3` | 0.94s | 60% | type, press, button | 35-65% |
| `click_04_click_sound_by_90_Creators.mp3` | 1.57s | 65% | type, press, button | 35-65% |
| `click_05_Click.wav` | 1.94s | 70% | type, press, button | 35-65% |
| `click_06_crumpled_paper_sound_fx.mp3` | 2.32s | 75% | type, press, button | 35-65% |
| `click_07_ES_Suction_Pop_5_-_SFX_Producer.mp3` | 0.65s | 80% | type, press, button | 35-65% |
| `click_08_futuristic_metal_keyboard.wav` | 0.95s | 85% | type, press, button | 35-65% |
| `click_09_Game_Menu_Select_Sound_Effect.mp3` | 1.78s | 90% | type, press, button | 35-65% |
| `click_10_keyboard_press.mp3` | 0.39s | 95% | type, press, button | 35-65% |
| `click_11_keyboard-typing-5997.mp3` | 15.6s | 100% | type, press, button | 35-65% |
| `click_12_mixkit-gun-click-1123.wav` | 0.87s | 100% | type, press, button | 35-65% |

### `GLITCHES` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `glitch_01_COMCell_Tech_Button_Switch_Lock_Iphone_x5_Variatio.wav` | 4.64s | 50% | glitch, simulation, matrix | 50-75% |
| `glitch_02_ROBTVox_Fun_Monster_Droid-2_Robot_Talk_03_ASD.wav` | 2.42s | 55% | glitch, simulation, matrix | 50-75% |
| `glitch_03_01_Processing.wav` | 1.78s | 60% | glitch, simulation, matrix | 50-75% |
| `glitch_04_02_Dial-up.wav` | 3.69s | 65% | glitch, simulation, matrix | 50-75% |
| `glitch_05_04_Erased_Data.wav` | 2.0s | 70% | glitch, simulation, matrix | 50-75% |
| `glitch_06_05_Reboot_Failure.wav` | 7.38s | 75% | glitch, simulation, matrix | 50-75% |
| `glitch_07_06_Portal_Hop.wav` | 2.33s | 80% | glitch, simulation, matrix | 50-75% |
| `glitch_08_07_Line_Break.wav` | 3.69s | 85% | glitch, simulation, matrix | 50-75% |
| `glitch_09_08_Rewinding.wav` | 2.33s | 90% | glitch, simulation, matrix | 50-75% |
| `glitch_10_09_Data_Transfer.wav` | 2.0s | 95% | glitch, simulation, matrix | 50-75% |
| `glitch_11_10_Access_Denied.wav` | 5.54s | 100% | glitch, simulation, matrix | 50-75% |
| `glitch_12_11_Access_Granted.wav` | 2.13s | 100% | glitch, simulation, matrix | 50-75% |

### `HEARTBEATS` (5 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `heartbeat_01_01_Beating.wav` | 21.33s | 50% | seconds remaining, heart racing, time is running out | 40-70% |
| `heartbeat_02_Clock_Tick.mp3` | 60.4s | 55% | seconds remaining, heart racing, time is running out | 40-70% |
| `heartbeat_03_Clock_ticking_fast.mp3` | 13.3s | 60% | seconds remaining, heart racing, time is running out | 40-70% |
| `heartbeat_04_Clock_Ticking_Sound_Effect(MP3_160K).mp3` | 8.14s | 65% | seconds remaining, heart racing, time is running out | 40-70% |
| `heartbeat_05_Clock_Ticking_Sound_Effect.mp3` | 8.16s | 70% | seconds remaining, heart racing, time is running out | 40-70% |

### `IMPACTS` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `impact_01_DSGNBram_Face_in_the_Mirror_Impact_ASD_XForce_x06.wav` | 67.44s | 50% | never happened, the truth is, actually | 55-85% |
| `impact_02_DSGNEthr_Magic_Black_Impact,_Projectile,_Creature,.wav` | 4.67s | 55% | never happened, the truth is, actually | 55-85% |
| `impact_03_ROCKCrsh_Magic_Earth_Impact,_Large_Projectile,_Slo.wav` | 2.86s | 60% | never happened, the truth is, actually | 55-85% |
| `impact_04_VEGETree_Magic_Foliage_Ent,_Living_Tree,_Footstep,.wav` | 2.87s | 65% | never happened, the truth is, actually | 55-85% |
| `impact_05_WATRSplsh_Magic_Liquid_Impact,_Large,_Projectile,_.wav` | 5.57s | 70% | never happened, the truth is, actually | 55-85% |
| `impact_06_05_Impact.wav` | 5.0s | 75% | never happened, the truth is, actually | 55-85% |
| `impact_07_09_Struck_Down.wav` | 3.75s | 80% | never happened, the truth is, actually | 55-85% |
| `impact_08_13_Metal_Slam.wav` | 7.41s | 85% | never happened, the truth is, actually | 55-85% |
| `impact_09_14_Incoming_Crash.wav` | 18.35s | 90% | never happened, the truth is, actually | 55-85% |
| `impact_10_Cartoon_Splat.wav` | 1.01s | 95% | never happened, the truth is, actually | 55-85% |
| `impact_11_Heavy_object_Hit_and_body_thud_sound_effect.mp3` | 2.93s | 100% | never happened, the truth is, actually | 55-85% |
| `impact_12_Hit_1.mp3` | 5.86s | 100% | never happened, the truth is, actually | 55-85% |

### `RISERS` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `riser_01_DSGNDron_Double_Bass,_Bowed,_Drone,_Harmonic,_Low_.wav` | 65.79s | 50% | what if, leading up to, getting closer | 45-75% |
| `riser_02_DSGNEthr_GHOSTS_Breath_Pulsating_ASD.wav` | 17.3s | 55% | what if, leading up to, getting closer | 45-75% |
| `riser_03_DSGNEthr_GHOSTS_Swell_Riser_Vaporous_ASD.wav` | 9.44s | 60% | what if, leading up to, getting closer | 45-75% |
| `riser_04_DSGNRise_Magic_Energy_Spell,_Electricity,_Large,_C.wav` | 7.75s | 65% | what if, leading up to, getting closer | 45-75% |
| `riser_05_DSGNRise_Sfx_Rise_Tension,_Transition,_Processed_B.wav` | 6.67s | 70% | what if, leading up to, getting closer | 45-75% |
| `riser_06_10_Evolve_Riser_Robo_Drums.wav` | 11.04s | 75% | what if, leading up to, getting closer | 45-75% |
| `riser_07_Ascending_sound_effect.mp3` | 4.44s | 80% | what if, leading up to, getting closer | 45-75% |
| `riser_08_BUILD-UP.mp3` | 1.92s | 85% | what if, leading up to, getting closer | 45-75% |
| `riser_09_ES_Riser_Suction_5_-_SFX_Producer.mp3` | 2.93s | 90% | what if, leading up to, getting closer | 45-75% |
| `riser_10_Sudden_suspense_Sound_effect.mp3` | 1.99s | 95% | what if, leading up to, getting closer | 45-75% |
| `riser_11_Upset_Pulses.wav` | 12.54s | 100% | what if, leading up to, getting closer | 45-75% |
| `riser_12_woosh-building-109596.mp3` | 2.59s | 100% | what if, leading up to, getting closer | 45-75% |

### `SILENCE` (2 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `silence_01_10_Dark_Drop.wav` | 11.65s | 50% | nothing happened, complete silence, nobody came | 30-60% |
| `silence_02_Drop_Disto_Sub_1.wav` | 5.75s | 55% | nothing happened, complete silence, nobody came | 30-60% |

### `TRANSITIONS` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `transition_01_MAGShim_Magic_Generic_Aura,_Pad,_Constant_ASD.wav` | 24.73s | 50% | stage 1, stage 2, years later | 45-75% |
| `transition_02_MAGShim_Magic_Generic_Building_Block,_Aura,_Glyph,.wav` | 3.74s | 55% | stage 1, stage 2, years later | 45-75% |
| `transition_03_MAGShim_Magic_Generic_Building_Block,_Processed_Be.wav` | 4.44s | 60% | stage 1, stage 2, years later | 45-75% |
| `transition_04_MAGShim_Magic_White_Fairy_Dust,_Chime,_Shimmer,_Cl.wav` | 5.06s | 65% | stage 1, stage 2, years later | 45-75% |
| `transition_05_MAGSpel_Magic_Cartoon_Spell,_Teleport,_Transition,.wav` | 2.35s | 70% | stage 1, stage 2, years later | 45-75% |
| `transition_06_WHSH_Sfx_Transition_Flashback,_Remembrance,_Deep_0.wav` | 3.05s | 75% | stage 1, stage 2, years later | 45-75% |
| `transition_07_-camera-shutter.wav` | 0.63s | 80% | stage 1, stage 2, years later | 45-75% |
| `transition_08_15_Fast_Forward.wav` | 2.22s | 85% | stage 1, stage 2, years later | 45-75% |
| `transition_09_29_Swing_A.wav` | 1.0s | 90% | stage 1, stage 2, years later | 45-75% |
| `transition_10_camera_shot_flash_2.wav` | 1.05s | 95% | stage 1, stage 2, years later | 45-75% |
| `transition_11_camera_shot_flash_4.wav` | 0.79s | 100% | stage 1, stage 2, years later | 45-75% |
| `transition_12_camera_shutter_2.mp3` | 0.63s | 100% | stage 1, stage 2, years later | 45-75% |

### `UPBEAT` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `upbeat_01_Applause.wav` | 25.73s | 50% | made millions, cash, success | 50-80% |
| `upbeat_02_Apple_Notification.wav` | 1.9s | 55% | made millions, cash, success | 50-80% |
| `upbeat_03_Cash_Register_(Kaching)_-_Sound_Effect_(HD).mp3` | 3.13s | 60% | made millions, cash, success | 50-80% |
| `upbeat_04_Cash_Register_sounds_effects_No_Copyright_free_use.mp3` | 2.35s | 65% | made millions, cash, success | 50-80% |
| `upbeat_05_Cash_Register.mp3` | 3.07s | 70% | made millions, cash, success | 50-80% |
| `upbeat_06_cash_ting.mp3` | 1.4s | 75% | made millions, cash, success | 50-80% |
| `upbeat_07_cash-register-purchase-87313.mp3` | 2.81s | 80% | made millions, cash, success | 50-80% |
| `upbeat_08_correct_sfx.mp3` | 1.45s | 85% | made millions, cash, success | 50-80% |
| `upbeat_09_Ding_Sound_Effect.mp3` | 2.81s | 90% | made millions, cash, success | 50-80% |
| `upbeat_10_Ding.mp3` | 0.55s | 95% | made millions, cash, success | 50-80% |
| `upbeat_11_Discord_Join.mp3` | 2.95s | 100% | made millions, cash, success | 50-80% |
| `upbeat_12_good-idea.mp3` | 3.55s | 100% | made millions, cash, success | 50-80% |

### `WHOOSHES` (12 tracks)
| Filename | Duration | Intensity | Best Trigger Phrases | Suggested Vol |
| :--- | :---: | :---: | :--- | :---: |
| `whoosh_01_FIREWhsh_Magic_Fire_Whoosh,_Small_Fireball,_Close_.wav` | 1.63s | 50% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_02_FOLYMisc_Rustle_Studio_Performed_Whoosh_Thorny_Bra.wav` | 18.0s | 55% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_03_WHSH_Magic_Air_Whoosh,_Twirl,_Wind_Gust,_Tremolo_0.wav` | 2.99s | 60% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_04_arrow_sounds.mp3` | 2.43s | 65% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_05_clean-fast-swooshaiff-14784.mp3` | 0.98s | 70% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_06_ES_Jump_Swish_-_SFX_Producer.mp3` | 1.2s | 75% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_07_Fast_Whoosh_Sound_Effect.mp3` | 1.91s | 80% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_08_fast-whoosh-118248.mp3` | 1.2s | 85% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_09_Long_whoosh_sound_effect.mp3` | 11.02s | 90% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_10_mixkit-arrow-whoosh-1491.wav` | 1.1s | 95% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_11_mixkit-cinematic-transition-wind-swoosh-1468.wav` | 1.32s | 100% | meanwhile, fast forward, zooming in | 40-70% |
| `whoosh_12_mixkit-cinematic-wind-swoosh-1471.wav` | 1.45s | 100% | meanwhile, fast forward, zooming in | 40-70% |

---
## 5. Complete Music Score Catalog (30 Assets)

### `DARK_DOCUMENTARY` (30 tracks)
| Filename | Duration | Tone | Recommended Base Vol |
| :--- | :---: | :--- | :---: |
| `dark_documentary_01_AMBSprt_Ice_Ambience_Skating_Rink_Outdoor_03_ASD.wav` | 29.6s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_02_CREAEthr_Creature_Ghost_Banshee,_Scream,_High_Pitc.wav` | 2.41s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_03_CRWDBatl_Yelling_Exterior,_Crowd,_Soldiers_In_War_.wav` | 36.81s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_04_DSGNBram_Face_in_the_Mirror_Impact_ASD_XForce_x06.wav` | 67.44s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_05_DSGNDron_Double_Bass,_Bowed,_Drone,_Harmonic,_Low_.wav` | 65.79s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_06_DSGNErie_Creature_Ghost_Theremin,_Classic,_Cliche,.wav` | 5.8s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_07_DSGNErie_GHOSTS_Noise_Electro-Magnetic_Turbulence_.wav` | 38.24s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_08_DSGNErie_Magic_Generic_Potion,_Explosion,_Burst,_A.wav` | 2.55s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_09_DSGNEthr_GHOSTS_Breath_Pulsating_ASD.wav` | 17.3s | Unsettling, serious, investigative, suspenseful | 14% |
| `dark_documentary_10_DSGNEthr_GHOSTS_Swell_Riser_Vaporous_ASD.wav` | 9.44s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_01_ANMLCat_Cat_Alley_Cat,_Street,_Meow_&_Groan_X6_ASD.wav` | 18.75s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_02_ANMLWild_Animal_Wild_Camel_B,_Grunt,_Groan,_Roar,_.wav` | 2.16s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_03_BELLLrg_Metal_Bell_Ringing,_Chapel_Medium_Size,_St.wav` | 22.57s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_04_BIRDFowl_Bird_Goose,_Scream,_Intense,_Single,_Isol.wav` | 8.21s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_05_BOATMech_Crank_Mechanism,_Sailing_Boat,_Short,_X6,.wav` | 23.91s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_06_CHEMAcid_Chemical_Acid_Sizzle,_Burn,_Short_04_ASD.wav` | 3.01s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_07_CREADino_Mosasaurus,_Aggro_01,_Full_Alternate_ASD_.wav` | 5.26s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_08_CREADino_Mosasaurus,_Aggro_01,_Full_ASD_Extinct.wav` | 5.26s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_09_CREADino_Mosasaurus,_Aggro_01,_Layer_A_ASD_Extinct.wav` | 5.26s | Unsettling, serious, investigative, suspenseful | 14% |
| `mysterious_10_CREADino_Mosasaurus,_Aggro_01,_Layer_B_ASD_Extinct.wav` | 5.26s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_01_Applause.wav` | 25.73s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_02_Apple_Notification.wav` | 1.9s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_03_Cash_Register_(Kaching)_-_Sound_Effect_(HD).mp3` | 3.13s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_04_Cash_Register_sounds_effects_No_Copyright_free_use.mp3` | 2.35s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_05_Cash_Register.mp3` | 3.07s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_06_cash_ting.mp3` | 1.4s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_07_cash-register-purchase-87313.mp3` | 2.81s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_08_good-idea.mp3` | 3.55s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_09_Mountain_Audio_-_New_Idea_Notification.mp3` | 4.07s | Unsettling, serious, investigative, suspenseful | 14% |
| `upbeat_10_quick-win.mp3` | 1.95s | Unsettling, serious, investigative, suspenseful | 14% |
