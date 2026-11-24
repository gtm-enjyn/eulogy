/* @bruin
name: raw.decisions
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.years
@bruin */

SELECT run_id, profile_id, year_index, protagonist_age, v->>'actor' AS actor, v->>'action' AS action, v->>'reason' AS reason
FROM raw.years, unnest((chapter->'decisions')::JSON[]) AS t(v)
