# Eulogy pipeline

Use Bruin v0.11.832 and Python 3. From the repository root, run the commands below. The local DuckDB connection is declared in [.bruin.yml](../../.bruin.yml).

```sh
bruin validate bruin/eulogy
bruin run bruin/eulogy
bruin lineage --full bruin/eulogy/assets/mart_decision_impact.sql
bruin query -c duckdb-default -q 'SELECT action, pct_speaks_with, pct_speaks_without, lift, n, n_without FROM mart_decision_impact ORDER BY lift DESC'
bash bruin/export.sh
```

Seven raw assets read JSONL and project its nested records. Two staging assets join eulogies to actual profile roles and collapse each role to a run-level flag. Three marts summarize endings, first-chapter decisions and the first child score below 50. A profile without a child has a null child rate.

Each decision row compares different lives of the same profile. Both cohorts require at least three observations. `lift` is the difference between two percentages in percentage points. CI re-exports the result and checks it against the copy the browser reads. [Captured output](../../docs/assets/decision-impact.txt)
