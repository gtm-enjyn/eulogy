/* @bruin
name: raw.eulogies
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.runs
custom_checks:
  - name: sentiment_in_range
    query: SELECT count(*) FROM raw.eulogies WHERE sentiment IS NULL OR sentiment NOT BETWEEN -1 AND 1
    value: 0
    blocking: true
@bruin */

SELECT run_id, profile_id, e->>'relative_id' AS relative_id, (e->>'speaks')::BOOLEAN AS speaks,
       (e->>'sentiment')::DOUBLE AS sentiment, e->>'text' AS eulogy
FROM raw.runs, unnest((document->'eulogies')::JSON[]) AS t(e)
