# Sponsor API contracts

The checked-in requests give a credential-free record of the three integrations. Their identifiers and example image URLs are fixtures. Unit tests exercise the authenticated code with a simulated HTTP transport. A live receipt would require the target account to accept a request.

| Service | What the public demo contains | Repeat locally from the repository root |
| --- | --- | --- |
| BAND | One room’s HTTP requests and all 30 lives’ addressed dialogue | `npx tsx scripts/band.ts --dry-run` |
| Telem | Five contextual search bodies and the default shock weights | `npx tsx scripts/telem.ts --dry-run` |
| Runware | Batches for portrait editing, text-to-image, textures, mesh generation and polling | `npx tsx scripts/runware.ts --dry-run` |

## BAND

The director authenticates with `X-API-Key` and verifies its registered ID with `GET /agent/me`. Each run creates a room, sets its title, adds the cast and sends dialogue. Public dialogue mentions the cast. A private line mentions its intended recipient. Human members can read the room. An unattended live run can use `--no-gate`. With a human observer configured, the final chapter waits for that observer’s reply. [Agent API](https://docs.band.ai/api/agent-api) · [Mention routing](https://docs.band.ai/understand/how-band-works)

A connected remote agent supplies `BAND_AGENT_ID` and `BAND_AGENT_KEY`. Named cast members can be discovered among the director’s own agents, across peer pages. Optional `BAND_CAST_JSON` entries use the logical role ID as the key and carry a registered UUID, display name, handle and optional agent key. A `human` entry identifies the observer. Per-role keys send as that character. With only the director key, the director relays scripted lines under its own identity. [Registration](https://docs.band.ai/quickstart) · [Agent and user credentials](https://docs.band.ai/security/authentication)

## Telem

Destiny sends five `POST /v1/search` requests with Bearer authentication. Each body contains `user_input.query` and `metadata.context`. The client reads normalized result rows under each provider’s `output_payload.results`. A usable snippet contains one in-range percentage and a matching topic. Its URL and text travel with the fictional shock weight. Other shocks retain their defaults. [Search quickstart](https://docs.telem.ai/quickstart/) · [Search parameters](https://docs.telem.ai/resources/search-parameters/)

An organization administrator or project Maintainer can issue `TELEM_API_KEY` in the project console. [Project credentials](https://docs.telem.ai/resources/faq/)

## Runware

The client sends Bearer-authenticated task arrays to `https://api.runware.ai/v1`. Three FLUX.1 Kontext edits use `bfl:3@1` with the same reference image at three ages. Without a reference image, the requests use text-to-image generation. The aged portrait URL becomes the image input to `microsoft:trellis-2@4b`. The mesh task returns a GLB in `outputs.files[].url`. Processing tasks are polled by their original UUID, with increasing intervals. The UI’s local textures are procedural. [Kontext examples](https://runware.ai/docs/models/bfl-flux-1-kontext-pro/examples) · [TRELLIS.2 inputs and outputs](https://runware.ai/docs/models/microsoft-trellis-2) · [Task polling](https://runware.ai/docs/models-api/task-polling)

A Runware project key supplies `RUNWARE_API_KEY`. The account dashboard can create and revoke individual keys. [Authentication](https://runware.ai/docs/models-api/authentication)
