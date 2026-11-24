/* @bruin
name: raw.relatives
type: duckdb.sql
materialization:
  type: table
@bruin */

SELECT p.json->>'id' AS profile_id, r->>'id' AS relative_id, r->>'relation' AS relation
FROM read_json_objects('data/profiles/*.json', format='unstructured') p,
     unnest((p.json->'relatives')::JSON[]) AS t(r)
