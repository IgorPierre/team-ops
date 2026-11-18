# API

Canonical contract: [`openapi/openapi.yaml`](../../openapi/openapi.yaml)

Envelope:

```json
{ "data": {}, "error": null, "meta": {} }
```

Auth:

- Humans: `POST /v1/auth/register` and `/login` set an HTTP-only cookie.
  After the first user, register requires `inviteToken` unless
  `REGISTRATION_OPEN=true`.
- Coding agents: `Authorization: Bearer tops_at_...` — OAuth access tokens
  issued when a developer connects an editor to `/mcp` (see [MCP](../mcp/README.md)).
  They act as an agent owned by that developer, bound to one organization.
- Scripts/CI: `Authorization: Bearer tops_sk_...` API keys (org-scoped).
- `GET /v1/auth/whoami` tells any caller who it is.

Roles: `admin` (org + keys + invites), `developer` (write tasks), `viewer` (read).

Idempotency: `external_ref` is unique per project when set.
Concurrency: send `expectedVersion` on task writes.
