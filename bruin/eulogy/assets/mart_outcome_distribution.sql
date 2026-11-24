/* @bruin
name: mart_outcome_distribution
type: duckdb.sql
materialization:
  type: table
depends:
  - stg.outcomes
@bruin */

WITH cluster_counts AS (
  SELECT profile_id,ending_cluster,count(*) AS n FROM stg.outcomes GROUP BY ALL
), clusters AS (
  SELECT profile_id,json_group_object(ending_cluster,n) AS clusters FROM cluster_counts GROUP BY profile_id
)
SELECT profile_id,count(*) AS n_runs,round(100*avg(child_speaks::INTEGER),1) AS pct_child_speaks,
       round(100*avg(partner_speaks::INTEGER),1) AS pct_partner_speaks,any_value(clusters.clusters) AS clusters
FROM stg.outcomes JOIN clusters USING (profile_id) GROUP BY profile_id
