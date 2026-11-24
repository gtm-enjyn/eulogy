/* @bruin
name: stg.eulogies
type: duckdb.sql
materialization:
  type: table
depends:
  - raw.eulogies
  - raw.relatives
columns:
  - name: relation
    type: VARCHAR
    checks:
      - name: not_null
      - name: accepted_values
        value: [partner, child, parent, sibling, friend, cofounder, other]
@bruin */

SELECT e.*, r.relation FROM raw.eulogies e LEFT JOIN raw.relatives r USING (profile_id, relative_id)
