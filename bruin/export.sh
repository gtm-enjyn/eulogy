#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
target=apps/web/public/data
mkdir -p "$target"
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT
for name in outcome_distribution decision_impact turning_points; do
  bruin query -c duckdb-default -q "SELECT * FROM mart_${name} ORDER BY ALL" -o json > "$temporary/$name.json"
done
python3 - "$temporary" "$target/marts.json" <<'PY'
import json, pathlib, sys
source, target = map(pathlib.Path, sys.argv[1:])
result = {}
for name in ('outcome_distribution','decision_impact','turning_points'):
    response = json.loads((source / (name+'.json')).read_text())
    rows = [dict(zip([column['name'] for column in response['columns']], row)) for row in response['rows']]
    for row in rows:
        if isinstance(row.get('clusters'), str):
            row['clusters'] = json.loads(row['clusters'])
    result[name] = rows
target.write_text(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)+'\n')
PY
