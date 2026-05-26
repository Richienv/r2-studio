---
title: 365-Reel DaVinci Resolve Template Brief
type: workflow-spec
project: weuseai.agent / Personal Brand
created: 2026-05-26
tags: [reels, davinci-resolve, content-system, 365-day-project]
status: ready-to-build
estimated-build-time: 4-6 jam (Sunday morning)
---

# 365-Reel DaVinci Resolve Template Brief

Brief ini buat satu Sunday morning session build template Resolve yang akan kepakai 365 hari ke depan. Bikin sekali, hemat ratusan jam. Setelah template jadi, edit time per reel turun dari ~90 menit ke ~30 menit.

Brief ini self-contained. Buka Resolve, ikutin urutan section di bawah, selesai dalam 4-6 jam.

---

## 1. Project Settings (Lock dulu sebelum apa-apa)

**File → Project Settings:**

- **Resolution:** 1080 × 1920 (custom, vertical 9:16)
- **Framerate:** 30 fps (delivery standard untuk IG/TikTok). Source footage iPhone tetap shoot di 60fps biar bisa slow-mo, tapi timeline 30fps.
- **Color Science:** DaVinci YRGB Color Managed
- **Input Color Space:** Apple Log (karena kamu shoot di Apple Log iPhone)
- **Timeline Color Space:** DaVinci WG / Intermediate
- **Output Color Space:** Rec.709 Gamma 2.4
- **Audio Sample Rate:** 48 kHz

Save project sebagai **`MASTER_365_TEMPLATE_v1`**. Setiap reel baru = duplicate this project, jangan pernah edit di template asli.

---

## 2. Three Color Modes (build sebagai PowerGrade)

Tiga mode = tiga LUT preset yang kamu apply di Color page tergantung pillar content. Build sekali di MASTER, save sebagai PowerGrade.

### Mode 1 — Workspace Warm
**Pakai untuk:** Senin (Belajar), Rabu (Build), Kamis (Struggle)

Nodes (urutan dari kiri ke kanan):
1. **Node 1 — Apple Log to Rec.709 transform** (Color Space Transform OFX: Apple Log → DaVinci WG → Rec.709 Gamma 2.4)
2. **Node 2 — Exposure & contrast:** Lift -0.02, Gamma -0.05, Gain +0.05, Contrast 1.10, Pivot 0.40
3. **Node 3 — Warm/teal split tone:** Color Wheels — Shadows toward teal (push -0.02 R, -0.01 G, +0.04 B), Highlights toward orange (+0.05 R, +0.02 G, -0.04 B), Midtones netral
4. **Node 4 — Skin tone protection:** Qualifier ambil skin tone, soft saturation boost +5, slight orange push
5. **Node 5 — Subtle film grain:** OFX Grain, ISO 800, intensity 0.30, size 0.50

Save sebagai PowerGrade: **`M1-Workspace-Warm`**

### Mode 2 — Outdoor Cool
**Pakai untuk:** Jumat (Hangzhou life), Sabtu (Mandarin journey), GMBA outdoor content

Nodes:
1. **Node 1 — Apple Log transform** (sama)
2. **Node 2 — Exposure:** Lift -0.04, Gamma -0.03, Gain 0, Contrast 1.15, Pivot 0.42
3. **Node 3 — Cool grade:** Shadows lebih biru (-0.03 R, 0 G, +0.05 B), Highlights slight cyan (-0.02 R, +0.01 G, +0.03 B)
4. **Node 4 — Saturation reduction:** Sat -8 untuk muted cinematic look
5. **Node 5 — Anamorphic feel:** Subtle horizontal blur di highlight only (Custom Curve, threshold tinggi), atau OFX Bloom dengan intensity 0.15

Save sebagai PowerGrade: **`M2-Outdoor-Cool`**

### Mode 3 — Manifesto Cinematic
**Pakai untuk:** Selasa (Mindset), Minggu (Vision)

Nodes:
1. **Node 1 — Apple Log transform** (sama)
2. **Node 2 — Aggressive contrast:** Lift -0.06, Gamma -0.04, Gain +0.03, Contrast 1.25, Pivot 0.40
3. **Node 3 — Deep teal/orange:** Shadows full teal (-0.04 R, -0.02 G, +0.06 B), Highlights warm orange (+0.06 R, +0.02 G, -0.05 B)
4. **Node 4 — Halation/bloom:** OFX Glow, threshold 0.75, intensity 0.25, di highlights only
5. **Node 5 — Film grain heavier:** Grain intensity 0.45, size 0.60
6. **Node 6 — Letterbox crop:** Subtle, 5% top/bottom black bars untuk cinematic feel (opsional, hanya untuk manifesto-tier)

Save sebagai PowerGrade: **`M3-Manifesto-Cinema`**

---

## 3. Typography & Text Overlay Templates

Build di **Fusion page** (lebih powerful dari Edit-page Text+). Save sebagai macro biar bisa drag-drop ke timeline mana aja.

Pakai 3 typeface yang konsisten sama brand weuseai.agent:

- **Inter Black** (download dari Google Fonts) — buat hook & body claims (max readability)
- **Instrument Serif** (download dari Google Fonts) — buat emphasis cinematic moments, italics
- **JetBrains Mono** (download dari Google Fonts) — buat stats, numbers, CTA, code-feel

### Template A — Hook Overlay
**Pakai:** Frame 0:00 - 0:05, satu kalimat hook

- **Font:** Inter Black, 90pt
- **Color:** White (#FFFFFF) dengan drop shadow soft (offset 4px, blur 8px, opacity 60%)
- **Position:** Center, slight upper third (y: -150 from center)
- **Animation:** Fade in dari blur 10px ke blur 0 dalam 12 frames (0.4s), hold, hard cut out di frame 5:00
- **Max chars:** 60 (3 baris max — break manually biar layout enak)

Save macro: **`Overlay-Hook`**

### Template B — Mid-point Overlay
**Pakai:** Throughout body untuk key claims, stats, atau emphasis

Dua varian:

**B1 — Stat/Number Overlay** (untuk angka)
- **Font:** JetBrains Mono Bold, 60pt
- **Color:** Brand red #E5322D (sama dengan weuseai.agent landing)
- **Position:** Bottom-left atau bottom-right, padding 80px dari edge
- **Animation:** Snap in (1 frame), hold for ~2 detik, snap out
- Save sebagai: **`Overlay-Stat`**

**B2 — Claim/Emphasis Overlay** (untuk kalimat penting)
- **Font:** Instrument Serif Italic, 55pt
- **Color:** White dengan slight off-white tint (#F5F5F0)
- **Position:** Centered, lower third
- **Animation:** Fade in 8 frames, hold, fade out 8 frames
- Save sebagai: **`Overlay-Claim`**

### Template C — CTA Outro
**Pakai:** Frame 0:40 - 0:50 di akhir reel

- **Font:** JetBrains Mono Medium, 36pt, UPPERCASE, letter-spacing 0.15em
- **Color:** White
- **Position:** Bottom center, 200px from bottom edge
- **Animation:** Fade in 15 frames, hold sampai end
- **Default copy:** `LINK DI BIO · 1.000 SEAT LAUNCH`
- Save macro: **`Overlay-CTA`**

---

## 4. Transitions (Locked rules — jangan improvisasi)

**Default = HARD CUT.** Selalu. 95% transisi di reel kamu hard cut.

**Yang boleh dipake (whitelist):**

- **Hard cut** — 95% kasus. Selalu cut on beat musik atau on accent voice.
- **L-cut / J-cut** — audio overlap 4-8 frames antar talking head segments untuk smooth flow
- **Match cut** — cut antar dua frame yang punya komposisi mirip (contoh: hand reach di B-roll → hand reach di talking head)
- **Flash transition (signature)** — 2-frame full white frame, dipakai maksimal 1× per reel di momen "beat change" major (transisi Act 1 → Act 2 atau Act 2 → Act 3). Ini signature kamu dari memory existing workflow.

**Yang DILARANG:**

- Zoom in/out transitions (CapCut-cheap feel)
- Spin/rotate
- Slide (kecuali untuk text overlay)
- Dissolve/crossfade (kecuali manifesto reel transisi ke fade-to-black ending)
- Glitch effect berlebihan

Build flash transition sebagai macro: **`FX-Flash-Beat`** (white solid 2 frames + subtle audio whoosh).

---

## 5. Audio & Music

**Voice channel:**

- Target loudness: **-14 LUFS** integrated (TikTok/IG standard)
- EQ: High-pass filter di 80Hz, slight boost +2dB di 3kHz untuk clarity, gentle de-esser
- Compressor: Ratio 3:1, threshold -18dB, attack 10ms, release 100ms
- Save sebagai audio preset: **`Voice-Talking-Head`**

**Music bed:**

- Target loudness: **-22 to -24 LUFS** (di bawah voice, jangan compete)
- Sidechain compression dari voice channel jadi music duck saat kamu ngomong
- Save sebagai: **`Music-Bed-Ducked`**

**Music library spec (build sebelum Sunday):**

Subscribe **Epidemic Sound ($15/bulan)** atau **Artlist ($10/bulan)**. Worth it. Free music kelihatan cheap dan banyak yang udah overused.

Curate 15-20 track jadi 3 folder:

```
/Music/
  /M1-Lofi-Warm/        (untuk workspace warm content)
    - tracks lofi/chillhop, BPM 70-85, mellow
  /M2-Ambient-Cool/     (untuk outdoor/Mandarin/GMBA)
    - tracks ambient/piano/strings, BPM 60-80, contemplative
  /M3-Cinematic-Build/  (untuk manifesto)
    - tracks dengan build-up, strings/orchestra, BPM 80-100, emotional climax
```

Rule: jangan pakai track yang sama dalam 7 hari berturut-turut. Rotasi.

---

## 6. The 3-Act Timing Structure (Frame-perfect)

Lock ini sebagai timeline marker di MASTER template. Setiap project baru = duplicate, timing udah ada.

**Total target durasi: 45-50 detik. Max 60 detik.**

```
0:00 - 0:05   ACT 1 — HOOK
              - Cold open B-roll (no face)
              - Hook overlay text lands by 0:02
              - Music bed sudah jalan dari 0:00
              - Voice-over masuk di 0:03 (overlap dengan hook visual)

0:05 - 0:35   ACT 2 — BODY (30 detik)
              - Cut ke talking head di 0:05
              - 4-6 cuts antara talking head dan B-roll
              - Mid-point overlay (stat/claim) muncul 2-3× di Act 2
              - Beat change/flash transition antara Act 1→2 dan Act 2→3

0:35 - 0:50   ACT 3 — OUTRO + CTA (15 detik)
              - Cinematic B-roll terakhir (kamu walking away, working, atau Hangzhou skyline)
              - Payoff statement voice-over
              - CTA overlay fade in di 0:42
              - Music build to soft fade-out
              - End frame: brand watermark subtle (lihat section 7)
```

Build timeline marker di MASTER:
- Marker biru di 0:05 (Act 1 end)
- Marker biru di 0:35 (Act 2 end)
- Marker merah di 0:50 (target end)

---

## 7. B-roll Bank Organization

Sunday batch: shoot 30-45 menit B-roll bareng talking-head batch. Tag dan organize biar drag-drop cepet pas edit.

**Folder structure (di local + cloud backup):**

```
/365-Project/
  /Footage/
    /YYYY-MM-DD-Sunday-Batch/
      /talking-head/
      /broll-workspace/
      /broll-hangzhou-outdoor/
      /broll-mac-screen/
      /broll-mandarin-study/
      /broll-coffee-routine/
      /broll-walking-pov/
  /B-roll-Library/        ← curate best 100-150 clips di sini
    /workspace/
    /outdoor-hangzhou/
    /mac-screen-record/
    /mandarin-study/
    /lifestyle-coffee/
    /pov-walking/
    /campus-zju/
```

Setiap Sunday, batch shoot:
- 5-7 talking head segments (untuk minggu depan)
- 10-15 short B-roll clips (3-8 detik each)
- Pindahin yang bagus ke `/B-roll-Library/` untuk repository pakai berulang

**B-roll shot list (set ini sebagai default tiap Sunday):**

- Hand typing di Mac (close-up, side angle)
- Mac screen scrolling Obsidian (screen record)
- Mac screen demo weuseai.agent dashboard (screen record)
- Coffee being poured / mug close-up
- Window light over keyboard
- Walking POV (Hangzhou street atau campus)
- Cycling POV (existing 10km daily route)
- Mandarin textbook / HSK study materials
- ZJU campus shots
- Backpack/desk setup wide

15-20 clip baru per Sunday, library tumbuh terus.

---

## 8. Brand Watermark (subtle, end frame only)

Bukan corner-watermark sepanjang reel — itu murah. Cuma di end frame, 2 detik terakhir.

- **Content:** "weuseai.agent" dalam Instrument Serif Italic 28pt + subtitle "by Richie" dalam JetBrains Mono 14pt uppercase
- **Position:** Bottom center, 150px from bottom
- **Color:** White 80% opacity
- **Animation:** Fade in di 0:48, hold 2 detik

Save macro: **`Outro-Watermark`**

---

## 9. Export Settings

**Deliver → Custom Export:**

- **Format:** MP4
- **Codec:** H.264
- **Resolution:** 1080 × 1920
- **Framerate:** 30 fps
- **Quality:** Restrict to 25,000 Kb/s (25 Mbps)
- **Audio Codec:** AAC, 320 kbps
- **Audio Sample Rate:** 48 kHz
- **Color Space:** Rec.709 Gamma 2.4

Save preset: **`Reel-Final-Export`**. One-click export tiap reel.

---

## 10. Workflow Checklist (per reel, post-template)

Setelah template ready, setiap reel ngikutin alur ini:

1. **Duplicate** MASTER project → rename `YYYY-MM-DD-Pillar-Topic`
2. **Import** talking head clip + relevant B-roll dari library
3. **Place** talking head di timeline, sync dengan 3-act marker
4. **Apply** PowerGrade sesuai pillar (M1/M2/M3)
5. **Cut** ke B-roll di Act 1 (hook), 4-6× di Act 2, 1-2× di Act 3
6. **Add** hook overlay di 0:00-0:05
7. **Add** mid-point overlays (stat/claim) 2-3× di Act 2
8. **Add** CTA overlay di 0:42
9. **Drop** music bed dari `/Music/Mx/` folder, sidechain ke voice
10. **Add** flash transition di 1 beat-change moment
11. **Add** outro watermark di 0:48
12. **Review** sekali full playback dengan headphone
13. **Export** dengan preset `Reel-Final-Export`
14. **Ship** — upload ke Instagram + TikTok, jangan over-iterate

Target time: **30-40 menit per reel** setelah template ready. Kalau lebih dari 45 menit, kamu over-iterating, ship as is.

---

## 11. Sunday Build Session Plan (4-6 jam)

Eksekusi template ini dalam satu Sunday morning. Urutannya:

| Slot | Durasi | Task |
|------|--------|------|
| 1 | 30 min | Project settings + folder structure setup |
| 2 | 90 min | Build 3 PowerGrades (M1, M2, M3) di Color page |
| 3 | 60 min | Build text overlay macros (Hook, Stat, Claim, CTA) di Fusion |
| 4 | 30 min | Audio presets (voice + music bed sidechain) |
| 5 | 30 min | Transitions macros (flash + outro watermark) |
| 6 | 45 min | Music library curation dari Epidemic/Artlist (15-20 track ke 3 folder) |
| 7 | 30 min | Export preset + timeline marker setup di MASTER |
| 8 | 30 min | Test render satu dummy reel buat verify semua jalan |

**Total: ~5.5 jam.** Plan: Minggu 9am-2:30pm dengan break makan siang.

---

## 12. Maintenance Rules

- **Jangan ubah template selama 30 hari pertama.** Lock the system, ship the content. Setelah 30 reel keluar, baru evaluate apa yang perlu di-adjust.
- **Versioning:** kalau adjust template (after day 30), save sebagai `MASTER_v2`, jangan overwrite v1.
- **B-roll library audit:** setiap akhir bulan, archive clip yang udah dipakai 3+ kali, refresh dengan footage baru.
- **Music rotation:** kalau ada track yang nyangkut algoritma (banyak yang relate), document di Obsidian, jangan dipakai lagi sampai 14 hari berikutnya.

---

## Catatan akhir

Template ini bukan sacred. Setelah 30-60 hari ada data, kamu bakal tau:
- Mode mana yang paling perform (mungkin Manifesto > Workspace, atau sebaliknya)
- Length sweet spot kamu (mungkin 35 detik lebih bagus dari 50)
- Hook overlay style mana yang convert (Inter Black vs Instrument Serif)

Adjust berdasarkan data, bukan vibe. Build sekali, ship 365 kali, refine setelah 30.

Sunday morning, 9am. Eksekusi.
