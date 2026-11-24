# Eulogy web

From the repository root, `npm ci && npm run demo` starts the Vite screening. The intro, profile, life atlas and chapel are at `/`, `/you`, `/lives` and `/chapel`. On the profile page, **Watch Louis’s lives** opens the 30-life archive. **Watch Jules’s service** opens the chapel with two dramatized lives.

The atlas reads the exported cohort statistics. In the chapel, **Play service** starts the narration. Select a witness to hear their testimony, or open **Decisions** and **Private feed** to inspect the selected chapter. [Cohort statistics](public/data/marts.json) · [Screenings](src/data/screening.ts)

The four [API handlers](api/) are exposed through the top-level Vercel functions. A static server supports the full recorded demo. Uploaded photos and generated live batches use private storage. [Contracts](api/contracts.ts)
