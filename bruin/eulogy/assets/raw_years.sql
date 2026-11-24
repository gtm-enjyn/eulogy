/* @bruin
name: raw.years
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.runs
@bruin */

SELECT run_id, profile_id, (y->>'year_index')::INTEGER AS year_index,
       (y->>'protagonist_age')::INTEGER AS protagonist_age, y->>'shock' AS shock, y AS chapter
FROM raw.runs, unnest((document->'years')::JSON[]) AS t(y)
