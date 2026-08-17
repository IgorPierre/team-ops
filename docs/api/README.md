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
- Agents: `Authorization: Bearer tops_sk_...` (org-scoped; cannot see other orgs).

Roles: `admin` (org + keys + invites), `developer` (write tasks), `viewer` (read).

Idempotency: `external_ref` is unique per project when set.
Concurrency: send `expectedVersion` on task writes.
