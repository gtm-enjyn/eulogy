# Blocs C, D, F, J — Intégrations sponsors

## C — BAND (Jules). Prix 500 $. Leur rubrique publique : band.ai/hacker-guide.
- Clés : app.band.ai → Agents → "Connect remote agent" → `BAND_AGENT_ID`, `BAND_AGENT_KEY`. Free tier sans carte.
- SDK : `uv add "band-sdk"` (Python) ou `npm i @band-ai/sdk` (TS). On prend TS dans `packages/sim/src/band.ts`.
- Mapping : **1 run = 1 room** nommée `life-<profile_id>-<seed>`. Participants : chaque proche (agent), Destin (agent), Protagonist (agent). Humain (Jules) membre observateur.
- Canal public = chaque `YearEvent` posté par Destin ("Year 3, age 33: Series A closes the week Léa is born") puis les `decisions` postées par le Protagonist, et une ligne par proche (son état, 1 phrase).
- Canal privé = `private_messages` envoyés par @mention entre proches (ce qu'ils disent de toi).
- Veto : Destin lit la réponse LLM ; si `fallbackYear` a dû être utilisé ou si le score de relation saute de > 50 en un chapitre, Destin poste "BLOCKED: incoherent year, re-rolling" et on relance. C'est leur critère "un agent qui peut bloquer".
- Human gate : avant le chapitre final, Destin @mention l'humain : "Approve the funeral? (yes/skip)". En démo on répond yes ; en mode `--no-gate` on saute.
- Delete test : sans BAND, les `private_messages` ne sont pas routés et le film n'a pas de canal privé. On le dit tel quel dans le pitch.
- Dégradé : si le SDK ne marche pas en 30 min, on écrit le transcript au format BAND dans `data/runs/<id>.band.jsonl` et on l'affiche. On le dit dans la PR (DEGRADED).

## D — Telem (Jules). Prix 500/300/100 $.
- Login Google → 20 $ de crédit sans carte. `TELEM_API_KEY`. REST `POST https://router.telem.ai/v1/search` et `/v1/fetch`, Bearer. Ou `npm i @telemai/sdk`.
- Usage : `packages/sim/src/priors.ts`. Au démarrage d'une simulation, Destin fait 4 à 6 recherches : "founder divorce rate study", "life expectancy by alcohol consumption US 2025", "burnout prevalence startup founders", "probability startup fails within 5 years", "estrangement adult children parents prevalence". Chaque appel porte `context: "Destiny needs the base rate of X to calibrate shock weights for profile <id>"`. C'est ce champ qui s'affiche dans leur console Observe comme "agent reasoning".
- Sortie : `data/priors/<profile_id>.json` `{ shock: weight, source_url, snippet }`. La simulation lit ces poids. Le ledger affiche la source quand un choc tombe ("Burnout, base rate 34 % (source: telem)").
- Bonus 10 min : un Monitor sur une page (ex. une étude) avec webhook vers une route no-op, pour le dire dans le pitch.
- Dégradé : `priors.default.json` committé avec les mêmes clés.

## F — API Vercel (Jules)
- `apps/web/api/simulate.ts` (Vercel function, Node, `maxDuration: 300`) : reçoit `Profile`, lance `simulateProfile(profile, { runs: 12 })` (12 en live pour tenir en 2 min ; la version complète = CLI 30-50), écrit chaque run dans Vercel Blob `runs/<profile_id>/<seed>.json`, renvoie `{ profile_id, run_ids, summary }`. Streaming SSE si simple, sinon polling `GET /api/runs?profile_id=`.
- `apps/web/api/upload.ts` : photo → Vercel Blob, renvoie `photoUrl`.
- `apps/web/api/portraits.ts` : appelle Runware (ci-dessous), renvoie `portraits[]`.
- Sans clés : renvoie 501 ; le front bascule en fixtures.

## J — Runware (Jules). Prix 200 $.
- Signup → `RUNWARE_API_KEY`, 2 $ de crédit. `POST https://api.runware.ai/v1` avec un tableau de tâches `taskType: "imageInference"`.
- Portraits vieillis depuis la photo : modèle d'édition image (FLUX Kontext ou équivalent, voir le rapport dans `docs/05b-runware-check.md`), `referenceImages: [photoUrl]`, prompts : "same person, age {age}, natural photo, soft light", "same person at {age+25}, grey hair, laugh lines, same eyes", "same person at {age+45}, elderly, kind, framed portrait photo on an easel". 1024×1024. Trois tâches dans un seul appel.
- Sans photo : `taskType: "imageInference"`, modèle texte→image rapide (FLUX schnell), prompt depuis `name/age/traits/city`.
- Textures : vitrail, sol, bois, en `seamless` quand possible. 4 images, un appel, mises dans `public/textures/`.
- 3D : voir `docs/05b-runware-check.md`. Si disponible : générer un buste 3D par proche depuis son portrait et le poser sur les bancs à la place des avatars RPM pour les plans larges (les avatars animés restent pour l'orateur). À tester une fois, 15 min max.

## K — Vidéo (Louis). Voir docs/06.
