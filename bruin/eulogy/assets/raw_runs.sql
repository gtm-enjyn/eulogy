/* @bruin
name: raw.runs
type: duckdb.sql
materialization:
  type: table
columns:
  - name: run_id
    type: VARCHAR
    checks: [{name: not_null}, {name: unique}]
  - name: death_age
    type: INTEGER
    checks: [{name: positive}]
@bruin */

SELECT json->>'run_id' AS run_id, json->>'profile_id' AS profile_id,
       (json->>'death_age')::INTEGER AS death_age, json->>'ending_cluster' AS ending_cluster, json AS document
FROM read_json_objects('data/runs/*.jsonl', format='newline_delimited', filename=true)
WHERE NOT ends_with(filename, '.band.jsonl')
