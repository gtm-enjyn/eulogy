# Eulogy web

From the repository root, `npm ci && npm run demo` starts the Vite screening. The intro, profile, life atlas and chapel are at `/`, `/you`, `/lives` and `/chapel`. Use **Watch Louis’s lives** to go straight from the form to the published data.

The atlas reads [marts.json](public/data/marts.json). The chapel plays one [screening](src/data/screening.ts), synchronizes audio to the speaker, scrolls the decision ledger and shows addressed messages. The WebGL fallback keeps captions and controls available. [Browser proof](../../docs/assets/browser-check.json)

The four [API handlers](api/) are exposed through the top-level Vercel functions. A static server supports the full recorded demo. Uploaded photos and generated live batches use private storage. [Contracts](api/contracts.ts)
