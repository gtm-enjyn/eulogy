# Shared contracts

[schemas.ts](src/schemas.ts) defines the profile, relationship, emotion, decision, chapter, eulogy, run and summary types using Zod. The simulator, browser and HTTP API share this boundary. A chapter can carry `claude`, `fallback` or `mock` provenance.

[sample.ts](src/sample.ts) is the handwritten development fixture. The public screening uses [the JSONL archive](../../data/runs/louis-demo.jsonl). Run `npm test -- packages/shared` from the repository root.
