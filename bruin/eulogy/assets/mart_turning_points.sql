/* @bruin
name: mart_turning_points
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.relative_states
  - raw.relatives
@bruin */

SELECT s.profile_id,s.run_id,min(s.year_index) FILTER (WHERE s.relationship_score<50) AS first_year_below_50,
       min(s.protagonist_age) FILTER (WHERE s.relationship_score<50) AS first_age_below_50
FROM raw.relative_states s JOIN raw.relatives r USING(profile_id,relative_id)
WHERE r.relation='child' GROUP BY s.profile_id,s.run_id
