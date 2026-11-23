# Eulogy

> Describe yourself in five lines. We simulate the rest of your life dozens of times with the people you love as AI agents, then show you your funeral: who stands up to speak, and what they say. Then the one decision, this year, that changes what they will say.

Built in one day at the Multiplayer AI Hackathon, San Francisco, 23 Nov 2026. **Track 1 — Agent Animated Film.**

## How it works
1. **Intro + onboarding** (`/`, `/you`): you were born; now tell us where you are. Precise fields: what you do, your flaw, your fear, the people who will be at your funeral and what they hold against you, your habits, your face.
2. **Simulation** (`packages/sim`): four relatives, a Protagonist and Destiny play your life in six chapters. Each relative carries a continuous emotional state, an episodic memory of the relationship and a relationship score. Destiny injects shocks calibrated on real base rates (Telem) and can veto an incoherent year. Same profile, different ending every run.
3. **BAND**: every life is a room. Relatives speak in public (your life) and in private (what they say about you when you are not there).
4. **Bruin**: every run lands in a DuckDB pipeline with quality checks and lineage. The mart `mart_decision_impact` answers the only question that matters: which year-one decision makes your daughter speak.
5. **Chapel** (`/chapel`): a 3D Gothic chapel. Your aged portrait and bust (Runware) by the coffin. Relatives stand, walk to the pulpit, speak with their own voices. The ledger shows every decision; the private feed shows what was never said aloud.

## Run it
```bash
npm install
cp .env.example .env            # fill the keys you have; everything degrades gracefully without them
npm run dev                     # apps/web on http://localhost:5173
npm run sim -- --profile data/profiles/louis.json --runs 30 --out data/runs   # add --mock without ANTHROPIC_API_KEY
bruin run bruin/eulogy && bash bruin/export.sh
```

## Sponsors
Bruin (pipeline, checks, lineage, `mart_decision_impact`) · BAND (rooms, private channel, Destiny's veto, human gate) · Telem (base-rate priors with the agent's reasoning traced) · Runware (aged portraits via FLUX Kontext, 3D busts via TRELLIS.2, textures) · AdaL (final edit).

## Team
Louis (simulation, data, sponsors) · Jules (everything you see). Plan and specs: `PLAN.md`, `docs/`.
