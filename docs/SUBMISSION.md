# Texte de soumission (à coller sur hackathons.crewbasecollective.com)

**Project name:** Eulogy

**Track:** Track 1 — Agent Animated Film

**One-liner:** Who will be at your table when you're seventy? Eulogy turns the people in your life into AI agents, plays your life a thousand times, and shows you the one decision that fills the table.

**Demo video (2:26):** https://eulogy-hackathon-film.vercel.app/ · direct file: https://github.com/louisktj/eulogy/releases/download/v1.0/eulogy-final-web.mp4
(full quality: https://github.com/louisktj/eulogy/releases/download/v1.0/eulogy-final.mp4)

**Public repo:** https://github.com/louisktj/eulogy

**Live app:** https://eulogy-ochre.vercel.app/

**Film page (streams in the browser):** https://eulogy-hackathon-film.vercel.app/

**Description:**
You describe yourself in five lines (or just talk). Eulogy builds your family as AI agents — each with a memory, a mood and a grudge — plus a fifth agent, Destiny, that rolls real-world shocks. Six chapters from now to seventy, every decision logged, every private message routed, replayed hundreds of times. The output is not a prediction: it's the most likely life, the life where the table is full, and the single year-one decision that separates them, with evidence.

Every project requirement is in the repo: visual characters (3D chapel with Ready Player Me cast), visual output (the film + the running app), movement and action, five agents with their own goals, and a visible decision ledger. Boosters: 3D, voices per character, memory that changes decisions across chapters.

**Sponsors, concretely:**
- **Bruin (mandatory, core):** `bruin/eulogy/` — 12 assets (raw → stg → mart), 11 quality checks, lineage, DuckDB. `mart_outcome_distribution` gives the number on screen; `mart_decision_impact` ranks year-one decisions by lift ("Ask for help" +20, "Take the late meeting" −25). Claude Code extends the pipeline through `bruin mcp`.
- **BAND:** one room per simulated life; public channel = the life, private @mentions = what relatives say behind your back; Destiny holds a veto and a human approval gate. Transcripts in `data/runs/*.band.jsonl`.
- **Telem:** Destiny fetches real base rates (divorce, burnout, illness, startup failure) before rolling shocks; every query carries the agent's reasoning in `context` for the Observe trace. `data/telem/requests.json`.
- **Runware:** FLUX.1 Kontext ages your face; TRELLIS.2 turns it into a 3D bust by the coffin. `scripts/runware.ts`.
- **Claude:** the six agents, zod on every output, deterministic fallback.

**Team:** Louis (film, data, sponsors) · Jules (app, pipeline, agents)

**How to run:** `npm install && npm run demo`
