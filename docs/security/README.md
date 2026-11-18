# Security notes

- Hash passwords with Argon2id; never log them.
- Store only hashes of API keys, OAuth codes and tokens. Prefixes (`tops_sk_`,
  `tops_at_`, `tops_rt_`) make leaked secrets easy to spot and scan for.
- MCP sign-in is OAuth 2.1 with PKCE S256 only; authorization codes are single
  use (a failed exchange burns the code), refresh tokens rotate, and redirect
  URIs must be https, loopback or an app scheme. Disconnecting an agent or
  demoting its owner to viewer cuts it off immediately.
- Keep `DATABASE_URL` in the environment, not in git.
- Backups contain all tenant data — encrypt and restrict them.
- Put HTTPS in front of the web and API listeners.
- Agent keys should be scoped (`tasks:read`, `tasks:move`, …).
- Leave `REGISTRATION_OPEN=false` in production. The first user may register;
  everyone else needs an invite from an org admin.
- Do not put the API on the public internet without TLS and a firewall.
