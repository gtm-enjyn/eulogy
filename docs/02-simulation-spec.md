# Bloc B — Simulation (Louis)

`packages/sim`. CLI : `npm run sim -- --profile data/profiles/<id>.json --runs 30 --out data/runs`. Sortie : `data/runs/<profile_id>.jsonl` (un `Run` par ligne) + `data/runs/<profile_id>.summary.json`.

## Modèle
- Horizon : 6 chapitres aux âges `now+2, now+5, now+10, now+20, now+35, death`. `death_age` tiré par Destin : base 81 (US), −4 si `alcohol ≥ 7`, −3 si `sleep ≤ 3`, +3 si `sport ≥ 5`, ±N(0,6) borné [now+6, 96]. `cause_of_death` choisie par le LLM parmi 8 causes pondérées par les habitudes.
- Agents : Protagoniste (traits, flaw, fear, ambition), 1-4 Proches, Destin. Modèle : `claude-sonnet-5-5` (vitesse). Un seul appel LLM par chapitre et par run, qui joue TOUS les agents d'un coup et renvoie un `YearEvent` complet (c'est 6 appels par run, 180 appels pour 30 runs, ~3 minutes en parallèle 10 à la fois).
- État porté entre chapitres : pour chaque proche `{ emotion, relationship_score, memories: string[] }` ; pour le protagoniste `{ wealth: -1..1, health: 0..1, decisions_so_far: string[] }`.
- Chocs Destin : pioche pondérée dans un catalogue (`shocks.ts`) : illness_self, illness_relative, startup_success, startup_failure, breakup, birth, move_abroad, parent_death, burnout, windfall, affair_discovered, lawsuit. Les poids viennent de `priors.json` (bloc D, Telem) sinon des valeurs par défaut du fichier.
- Prompt : system = rôle "simulateur de vie, tu joues chaque personnage avec sa mémoire et sa rancune, tu réponds uniquement en JSON au schéma donné". user = profil + état + choc + "chapitre k/6, âge X". Demander explicitement 1-2 `private_messages` entre proches, à propos du protagoniste, dans leur voix.
- Chapitre final (death) : pour chaque proche, `Eulogy { speaks, text, sentiment }`. Règle dure, hors LLM : `speaks = relationship_score ≥ 55`. Le LLM écrit le texte (≤ 60 mots, à la première personne, qui cite un souvenir précis des chapitres). Si `speaks=false`, `text` = ce qu'il/elle pense sans le dire (sera affiché dans le canal privé).
- Variabilité : `seed` → température 0,9 + choc différent + ordre de parole différent. Même profil, fins différentes : c'est le critère de la track.
- `ending_cluster` : règle simple post-hoc : `reconciled` si ≥ 3 proches parlent et sentiment moyen > 0,3 ; `estranged` si ≤ 1 parle ; `admired_not_loved` si le cofondateur/ami parle mais pas enfant/partenaire ; sinon `mixed`.

## Robustesse
- Sortie LLM validée par zod. Échec → une relance avec l'erreur zod dans le prompt → échec → fallback déterministe (`fallbackYear()`), jamais de crash.
- `--runs` plafonné à 50. Concurrence 10. Timeout 40 s par appel.
- Sans `ANTHROPIC_API_KEY` : mode `--mock` qui produit des runs par mutation de `sampleRun` (déjà en place).

## Interface promise aux autres blocs
- Fichier `data/runs/<profile_id>.jsonl`, schéma `Run`.
- `summary.json` : `{ n_runs, pct_child_speaks, pct_partner_speaks, clusters: Record<string, number>, most_probable_run_id, best_run_id }` où `best_run_id` = le run `reconciled` au score moyen le plus haut (celui qu'on montre en deuxième).
- Fonction exportée `simulateProfile(profile, { runs, onRun })` pour le bloc F.

## Critères d'acceptation
- [ ] 30 runs réels sur le profil de Louis en < 4 min, 0 crash, 100 % valides zod.
- [ ] Au moins 2 clusters différents sur 30 runs.
- [ ] Les éloges citent des événements des chapitres (vérif à l'œil sur 3 runs).
- [ ] Tests vitest : schéma, fallback, clusterisation.
