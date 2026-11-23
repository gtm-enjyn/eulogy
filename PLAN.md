# EULOGY — PLAN (le graphe de blocs)

Deux humains, deux agents de code. **Louis** = Claude Code. **Jules** = Codex. Deadline 17h15.
Chaque bloc : propriétaire, dépendances, ce qu'il reçoit, ce qu'il promet (l'interface exacte), critères de "fini", budget temps. Un bloc n'est commencé que quand ses dépendances sont **mergées sur main**, sauf si la spec dit "mock depuis shared".

Graphe (→ = "produit l'entrée de") :
```
A shared schemas+fixtures ──→ B sim ──→ E bruin ──→ I lives grid (chiffres)
        │                     │  └──→ F api ──→ G onboarding (submit)
        │                     └──→ C band, D telem (enrichissent B)
        ├──→ G intro+onboarding ──→ J runware portraits+3D ──→ H chapel
        ├──→ H chapel (mock sampleRun)      
        └──→ I lives grid (mock sampleRun)
H + I + G + B + E ──→ L intégration ──→ K vidéo ──→ M soumission
```

## A — Schémas partagés + fixtures (Louis) · 15 min · FAIT par le scaffold
- Promet : `packages/shared/src/index.ts` (zod `Profile`, `Relative`, `Run`, `YearEvent`, `Eulogy`, …), `sampleProfile`, `sampleRun`.
- Fini quand : `npm test` vert, PR mergée. **Tout le monde démarre là-dessus.**

## B — Simulation Claude (Louis) · 60 min · dépend de A
- Spec : docs/02. Reçoit : `Profile` JSON. Promet : `data/runs/<profile_id>.jsonl` + `summary.json` + `simulateProfile()`.
- Fini quand : 30 runs réels sur le profil de Louis, 0 crash, ≥ 2 clusters, tests verts.
- Dégradé : mode `--mock` (déjà là).

## C — BAND rooms (Louis) · 30 min · dépend de B (peut démarrer en parallèle sur sampleRun)
- Spec : docs/05 §C. Promet : `packages/sim/src/band.ts` (`openRoom`, `postPublic`, `postPrivate`, `veto`, `humanGate`) appelé par B ; `data/runs/<id>.band.jsonl` (transcript) lu par le front.
- Fini quand : une room visible dans app.band.ai avec ≥ 3 agents, messages privés routés, 1 veto déclenché en test.

## D — Telem priors (Louis) · 25 min · dépend de rien (parallèle à B)
- Spec : docs/05 §D. Promet : `data/priors/<profile_id>.json` + `data/priors/default.json` ; B lit les poids ; chaque appel porte `context`.
- Fini quand : 5 recherches visibles dans la console Observe de Telem avec le raisonnement de Destin.

## E — Pipeline Bruin (Louis) · 45 min · dépend de B (démarre sur les runs `--mock`)
- Spec : docs/03. Promet : `bruin/eulogy/` validé, `bruin run` vert, `apps/web/public/data/marts.json` exporté, screenshot lineage.
- Fini quand : `mart_decision_impact` a une ligne `n ≥ 3`, CI `bruin validate` vert.

## F — API Vercel (Louis) · 30 min · dépend de B
- Spec : docs/05 §F. Promet : `POST /api/simulate`, `POST /api/upload`, `POST /api/portraits`. Sans clés → 501.
- Fini quand : depuis le front déployé, un profil lance 12 runs et `/lives` les affiche.

## G — Intro + onboarding (Jules) · 45 min · dépend de A
- Spec : docs/01. Promet : routes `/` et `/you`, profil valide dans zustand + localStorage, webcam/upload, appel `/api/simulate` avec fallback fixtures.
- Fini quand : critères docs/01 cochés, Chrome local.

## H — Chapelle 3D (Jules) · 90 min · dépend de A (mock `sampleRun`), reçoit J quand prêt
- Spec : docs/04. Promet : route `/chapel` qui joue un `Run` complet sans clic (lever, marcher, parler, s'asseoir), Ledger, PrivateFeed, 3 caméras, `Next life`.
- Ordre interne : lumière+fog (15 min) → mobilier+bancs (15) → avatars RPM posés (15) → séquence orateur avec fallback téléport (20) → Mixamo si le temps (15) → UI ledger/feed (10).
- Fini quand : 60 fps, un run se joue en entier avec audio, capture plein écran propre.

## I — Grille de vies + révélation (Jules) · 30 min · dépend de A, reçoit E (`marts.json`) quand prêt
- Promet : route `/lives` : canvas de N lignes de vie qui défilent en parallèle (une par run, événements = points, fin = couleur du cluster), compteur réel, puis repli en une phrase : "In {pct} % of your lives, {child} does not speak at your funeral." depuis `marts.json` (fallback `summary.json`). Bouton → `/chapel`.
- Fini quand : la transition grille→phrase est fluide et le chiffre vient des données.

## J — Runware portraits + textures + 3D (Jules) · 40 min · dépend de G (photo) ; textures sans dépendance
- Spec : docs/05 §J + docs/05b. Promet : `portraits[]` dans le profil, `public/textures/{rose,floor,wood}.png`, buste GLB du protagoniste vieilli sur socle dans H, bustes des proches si temps.
- Ordre : textures (10 min, débloque H) → portraits vieillis (10) → buste 3D protagoniste (10) → bustes proches (10).

## K — Capture vidéo (Jules) · 30 min · dépend de H, I, G, E
- Spec : docs/06. Promet : rushs 1080p60 des 8 plans dans `video/raw/`.

## L — Intégration (les deux) · 16h15-16h50
- Brancher les vrais runs (B) dans H et I, `marts.json` (E) dans I, voix (scripts/voices.ts) dans H, transcript BAND (C) dans PrivateFeed. Déployer sur Vercel. Jouer la démo deux fois de bout en bout.

## M — Montage AdaL + soumission (Louis) · 16h50-17h15
- docs/06. README, repo public, lien Vercel, lien vidéo, texte de soumission avec la phrase du mart.

## Horaire
| Heure | Louis | Jules |
|---|---|---|
| 15:30 | A mergé, lance B | G intro+form |
| 15:45 | B (prompt, boucle) + D en parallèle | J textures → H lumière/mobilier |
| 16:00 | B runs réels, C band | H avatars + séquence |
| 16:15 | E bruin sur runs réels, F api | I grille, J portraits/3D |
| 16:30 | E export marts, voix | H finitions, K rushs |
| 16:50 | L + M | L + K |
| 17:15 | **soumis** | |

## Règle d'or
À 16h30, on gèle les features. Tout ce qui n'est pas vert à 16h30 passe en version dégradée. Une démo moche qui tourne bat une démo belle qui ne tourne pas.
