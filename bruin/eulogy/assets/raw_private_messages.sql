/* @bruin
name: raw.private_messages
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.years
@bruin */

SELECT run_id, profile_id, year_index, protagonist_age, v->>'from' AS sender, v->>'to' AS recipient, v->>'text' AS message
FROM raw.years, unnest((chapter->'private_messages')::JSON[]) AS t(v)
