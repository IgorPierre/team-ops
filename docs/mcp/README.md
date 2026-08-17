# MCP

`@team-ops/mcp` is a thin stdio server. It calls the Team-Ops HTTP API.
It does not know about PostgreSQL, Docker, or cloud vendors.

```env
TEAM_OPS_URL=https://teamops.company.com
TEAM_OPS_TOKEN=tops_sk_xxxxx
```

Tools include `team_ops_list_tasks`, `team_ops_upsert_task`,
`team_ops_move_task`, `team_ops_report_progress`, `team_ops_request_review`,
and `team_ops_complete_task`. Upsert looks up `external_ref`, then title,
before creating a row.
