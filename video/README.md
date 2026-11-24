# Eulogy — the film

90-second demo film, built programmatically with Remotion.

- `src/Film.tsx` — master timeline (audio layers, 8 scenes, captions, global grain/vignette/letterbox).
- `src/scenes.tsx` — scene components: Birth, FiveLines (typed form), Face (aging), ThousandLives (procedural life-line montage), Reveal, Ledger, PrivateLine, Clip, MartOverlay, Credits.
- `src/ui.tsx` — primitives: KenBurns push-in, TypeText, Caption, Line, Grain, Letterbox.
- `public/img` — stills (Higgsfield Cinema Studio 2.5, 2K). `public/clips` — Kling 3.0 image-to-video clips. `public/audio` — Eleven v4 voice-over and eulogies, ElevenLabs Music score, heartbeat SFX.

```bash
cd video && npm install
npm run studio    # live preview
npm run render    # out/eulogy.mp4
```

Script and shot list: `../docs/06-video-storyboard.md`.
