/* @bruin
name: stg.outcomes
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.runs
  - stg.eulogies
@bruin */

SELECT r.profile_id, r.run_id, r.ending_cluster,
       bool_or(e.speaks) FILTER (WHERE relation='child') AS child_speaks,
       bool_or(e.speaks) FILTER (WHERE relation='partner') AS partner_speaks
FROM raw.runs r LEFT JOIN stg.eulogies e USING (profile_id,run_id)
GROUP BY ALL
