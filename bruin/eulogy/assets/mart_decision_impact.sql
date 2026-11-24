/* @bruin
name: mart_decision_impact
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.decisions
  - stg.outcomes
custom_checks:
  - name: both_cohorts_have_three_lives
    query: SELECT count(*) FROM mart_decision_impact WHERE n < 3 OR n_without < 3
    value: 0
    blocking: true
@bruin */

WITH choices AS (
  SELECT DISTINCT profile_id,run_id,action FROM raw.decisions WHERE year_index=0 AND actor=profile_id
), actions AS (SELECT DISTINCT profile_id,action FROM choices),
cohorts AS (
  SELECT o.profile_id,a.action,o.child_speaks,c.run_id IS NOT NULL AS chosen
  FROM stg.outcomes o JOIN actions a USING (profile_id)
  LEFT JOIN choices c ON c.profile_id=o.profile_id AND c.run_id=o.run_id AND c.action=a.action
  WHERE o.child_speaks IS NOT NULL
), rates AS (
  SELECT profile_id,action,count(*) FILTER (WHERE chosen) AS n,count(*) FILTER (WHERE NOT chosen) AS n_without,
         round(100*avg(child_speaks::INTEGER) FILTER (WHERE chosen),1) AS pct_speaks_with,
         round(100*avg(child_speaks::INTEGER) FILTER (WHERE NOT chosen),1) AS pct_speaks_without
  FROM cohorts GROUP BY ALL HAVING n>=3 AND n_without>=3
)
SELECT *,round(pct_speaks_with-pct_speaks_without,1) AS lift FROM rates
