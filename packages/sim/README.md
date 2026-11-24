# Life simulation

Run from the repository root. `npm run sim -- --profile data/profiles/louis.json --runs 30 --mock --out .local/replay` recreates the published lives. `npm run ensemble` runs 1,000 seeds and fingerprints the output. A single batch accepts 1–50 lives and runs at most ten lives concurrently.

For the live client, configure `ANTHROPIC_API_KEY` or a supported Vercel Gateway credential and omit `--mock`. Each accepted model response receives `generation: "claude"`. The first failure triggers a corrected request. A second failure records `fallback` on that chapter. The standard simulator accepts `--no-gate` for unattended BAND runs.

[Simulation loop](src/simulate.ts) · [Full prompt and schema](../../docs/ARCHITECTURE.md) · [Cluster and retry tests](src/generate.test.ts)
