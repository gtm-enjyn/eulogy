/* @bruin
name: raw.relative_states
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.years
custom_checks:
  - name: relationship_score_in_range
    query: SELECT count(*) FROM raw.relative_states WHERE relationship_score IS NULL OR relationship_score NOT BETWEEN 0 AND 100
    value: 0
    blocking: true
@bruin */

SELECT run_id, profile_id, year_index, protagonist_age, v->>'relative_id' AS relative_id, (v->'emotion'->>'valence')::DOUBLE AS valence,
       (v->'emotion'->>'arousal')::DOUBLE AS arousal, (v->>'relationship_score')::DOUBLE AS relationship_score
FROM raw.years, unnest((chapter->'relative_states')::JSON[]) AS t(v)
