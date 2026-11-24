# Jules — démarrage en 3 minutes

## 1. Accepte l'invitation
https://github.com/gtm-enjyn/eulogy/invitations (accès en écriture).

## 2. Clone et installe
```bash
git clone https://github.com/gtm-enjyn/eulogy && cd eulogy && npm install && npm run dev
```
`http://localhost:5173` : les 4 routes tournent déjà avec des données de démo (`/`, `/you`, `/lives`, `/chapel`).

## 3. Colle ce prompt dans Codex, tel quel

> Tu es Jules sur le projet Eulogy. Lis `AGENTS.md` puis `PLAN.md` en entier avant d'écrire une ligne. Tes blocs sont G, H, I, J, K ; tu ne touches jamais à `packages/sim`, `bruin/`, `apps/web/api` ni à `packages/shared` (si tu as besoin d'un champ en plus, note-le dans ta PR, Louis l'ajoutera).
>
> Ordre de travail, une branche et une PR par bloc, avec `scripts/new-branch.sh <bloc>-<description>` puis `scripts/ship.sh "<message>"` dès qu'une sous-tâche marche :
> 1. **J textures** (10 min) : génère avec Runware les textures du vitrail, du sol et du bois selon `docs/05b-runware-check.md`, mets-les dans `apps/web/public/textures/`. Si pas de clé Runware dans `.env`, prends des textures CC0 (ambientCG) et note DEGRADED.
> 2. **H chapelle** (`docs/04-chapel-3d-spec.md`) dans l'ordre exact de la spec : lumière et fog → mobilier et cercueil → vitrail émissif → avatars Ready Player Me assis → séquence orateur (se lève, marche au pupitre, parle, revient) avec le fallback téléportation si Mixamo n'est pas prêt → 3 caméras nommées → Ledger et PrivateFeed branchés sur le `Run` → bouton Next life. Texte à l'écran en anglais. Vise 60 fps.
> 3. **G intro + onboarding** (`docs/01-onboarding-spec.md`) : l'intro "You were born" de 8 s, puis le formulaire champ par champ exactement comme la spec, validation zod `ProfileSchema`, webcam et upload photo, fallback fixtures si `/api/simulate` répond 501.
> 4. **I grille de vies** : canvas des vies qui défilent, compteur réel, repli en une phrase avec le pourcentage lu dans `public/data/marts.json` (fallback `summary.json`).
> 5. **J portraits et 3D** : 3 portraits vieillis via FLUX Kontext `bfl:3@1`, buste GLB du protagoniste via TRELLIS.2 `microsoft:trellis-2@4b`, posé sur un socle près du cercueil.
> 6. **K rushs** : capture 1080p60 des 8 plans de `docs/06-video-storyboard.md`.
>
> Règles : `npm run lint && npm run typecheck && npm test && npm run build` avant chaque push. À 16h30 tu gèles les features et tu passes tout ce qui n'est pas fini en version dégradée. Tu ne poses pas de question à l'humain : tu prends la version dégradée de la spec et tu écris DEGRADED dans le titre de la PR.

## 4. Clés à mettre dans `.env` (jamais commitées)
`RUNWARE_API_KEY` (runware.ai, 2 $ offerts, clé instantanée), `ELEVENLABS_API_KEY`. Le reste est côté Louis.
