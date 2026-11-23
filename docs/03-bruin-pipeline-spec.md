# Bloc E — Pipeline Bruin (Louis). C'est le prix à 1 000 $.

Install : `curl -LsSf https://getbruin.com/install/cli | sh`. Dossier `bruin/eulogy/`.

## Structure
```
bruin/eulogy/
  pipeline.yml            # name: eulogy, default_connections: duckdb: duckdb-default
  .bruin.yml              # connections: duckdb-default: path: ./eulogy.duckdb
  assets/
    raw_runs.py           # python asset, materialization table raw.runs : lit data/runs/*.jsonl → 1 ligne par run
    raw_years.py          # table raw.years : 1 ligne par (run_id, year_index) avec shock, protagonist_age
    raw_decisions.py      # table raw.decisions : (run_id, year_index, actor, action, reason)
    raw_relative_states.py# table raw.relative_states : (run_id, year_index, relative_id, valence, arousal, relationship_score)
    raw_private_messages.py
    raw_eulogies.py       # table raw.eulogies : (run_id, relative_id, speaks, sentiment, text)
    stg_eulogies.sql      # join relatives (relation) ; flags child_speaks, partner_speaks
    mart_outcome_distribution.sql   # par profile_id : n_runs, pct_child_speaks, pct_partner_speaks, pct par cluster
    mart_decision_impact.sql        # LE mart : pour chaque action de l'année 1 (year_index=0), pct child_speaks quand présente vs absente, lift, n
    mart_turning_points.sql         # par run : première année où relationship_score de l'enfant passe sous 50
```
## Checks (visibles dans `bruin run`, c'est ce que Bruin veut voir)
- `raw.runs.run_id` : not_null, unique. `death_age` : positive. 
- `raw.eulogies.sentiment` : custom check `sentiment between -1 and 1`.
- `raw.relative_states.relationship_score` : custom `between 0 and 100`.
- `stg_eulogies.relation` : accepted_values [partner, child, parent, sibling, friend, cofounder, other].
- `mart_decision_impact.n` : custom `n >= 3` (pas de conclusion sur 2 runs).

## Commandes de démo (à filmer)
```
bruin validate bruin/eulogy
bruin run bruin/eulogy
bruin lineage bruin/eulogy/assets/mart_decision_impact.sql --full
bruin query -c duckdb-default -q "select action, pct_speaks_with, pct_speaks_without, lift, n from mart_decision_impact order by lift desc limit 5"
claude mcp add --scope user bruin -- "$(which bruin)" mcp     # puis demander à Claude Code d'ajouter mart_turning_points, filmer
bruin ai skills all
```
## Export vers le front
Script `bruin/export.sh` : `bruin query ... -o json > apps/web/public/data/marts.json` avec `{ outcome_distribution, decision_impact, turning_points }`. Le front lit ce fichier (bloc I). Les chiffres à l'écran viennent d'ici.

## Critères d'acceptation
- [ ] `bruin validate` vert en CI.
- [ ] `bruin run` vert en local sur 30 runs réels, tous les checks passent.
- [ ] `mart_decision_impact` donne au moins une ligne avec `n ≥ 3` et un lift lisible.
- [ ] `marts.json` exporté et commité pour le profil démo.
- [ ] Screenshot de `bruin lineage` dans `docs/assets/lineage.png`.
