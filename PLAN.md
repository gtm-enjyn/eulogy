# EULOGY — PLAN (le graphe de blocs)

Jules est le seul développeur et possède A–J, L et M. Louis possède K, la capture et le montage de la vidéo AdaL. Soumission à 17h15, heure de San Francisco.
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

## État de livraison au gel

| Blocs | Responsable | Résultat vérifiable |
|---|---|---|
| A, B | Jules | Schémas et moteur à six chapitres. Trente vies déterministes publiées, accès Claude hébergé refusé par le fournisseur. |
| E | Jules | Douze assets Bruin et huit contrôles réussis, export DuckDB publié. |
| G, H, I | Jules | Démo publique jouée dans Chrome, six pistes audio, mesure à 30 images/s. |
| J, D, C | Jules | Clients Runware, Telem et BAND et requêtes de démo étiquetées dry-run. |
| F, L | Jules | Routes Vercel et Blob privé vérifiés, ensemble de mille vies reproductible. |
| K | Louis | Sources du film dans la PR vidéo. Lien public du montage attendu. |
| M | Jules | Liens publics et description préparés pour la soumission. |

[Preuves](docs/EVIDENCE.md) · [Dossier de soumission](docs/SUBMISSION.md)

## A — Schémas partagés + fixtures (Jules) · 15 min · FAIT par le scaffold
- Promet : `packages/shared/src/index.ts` (zod `Profile`, `Relative`, `Run`, `YearEvent`, `Eulogy`, …), `sampleProfile`, `sampleRun`.
- Fini quand : `npm test` vert, PR mergée. **Tout le monde démarre là-dessus.**

## B — Simulation Claude (Jules) · 60 min · dépend de A
- Spec : docs/02. Reçoit : `Profile` JSON. Promet : `data/runs/<profile_id>.jsonl` + `summary.json` + `simulateProfile()`.
- Fini quand : 30 runs réels sur le profil de Louis, 0 crash, ≥ 2 clusters, tests verts.
- Dégradé : mode `--mock` (déjà là).

## C — BAND rooms (Jules) · 30 min · dépend de B (peut démarrer en parallèle sur sampleRun)
- Spec : docs/05 §C. Promet : `packages/sim/src/band.ts` (`openRoom`, `postPublic`, `postPrivate`, `veto`, `humanGate`) appelé par B ; `data/runs/<id>.band.jsonl` (transcript) lu par le front.
- Fini quand : une room visible dans app.band.ai avec ≥ 3 agents, messages privés routés, 1 veto déclenché en test.

## D — Telem priors (Jules) · 25 min · dépend de rien (parallèle à B)
- Spec : docs/05 §D. Promet : `data/priors/<profile_id>.json` + `data/priors/default.json` ; B lit les poids ; chaque appel porte `context`.
- Fini quand : 5 recherches visibles dans la console Observe de Telem avec le raisonnement de Destin.

## E — Pipeline Bruin (Jules) · 45 min · dépend de B (démarre sur les runs `--mock`)
- Spec : docs/03. Promet : `bruin/eulogy/` validé, `bruin run` vert, `apps/web/public/data/marts.json` exporté, screenshot lineage.
- Fini quand : `mart_decision_impact` a une ligne `n ≥ 3`, CI `bruin validate` vert.

## F — API Vercel (Jules) · 30 min · dépend de B
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

## K — Capture et montage vidéo AdaL (Louis) · 30 min · dépend de H, I, G, E
- Spec : docs/06. Promet : rushs 1080p60 des 8 plans et lien de la vidéo AdaL remis à Jules.

## L — Intégration (Jules) · 16h15-16h50
- Brancher les vrais runs (B) dans H et I, `marts.json` (E) dans I, voix (scripts/voices.ts) dans H, transcript BAND (C) dans PrivateFeed. Déployer sur Vercel. Jouer la démo deux fois de bout en bout.

## M — Dossier et soumission (Jules) · 16h50-17h15
- docs/06. README, repo public, lien Vercel, lien vidéo, texte de soumission avec la phrase du mart.

## Horaire
| Heure (San Francisco) | Jules | Louis |
|---|---|---|
| Avant 16h30 | Simulation, Bruin, chapelle, onboarding et intégrations | Préparation et tournage du film |
| 16h30 | Gel des fonctionnalités, tests, stabilité et preuves | Capture et montage AdaL |
| 17h00 | Dernière PR, README et preuves | Transmission du lien vidéo |
| 17h15 | Soumission avec les liens vérifiés | Vidéo |
 
## Règle d'or
À 16h30, on gèle les features. Tout ce qui n'est pas vert à 16h30 passe en version dégradée. Une démo moche qui tourne bat une démo belle qui ne tourne pas.
