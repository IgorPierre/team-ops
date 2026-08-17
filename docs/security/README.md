# Security notes

- Hash passwords with Argon2id; never log them.
- Store only API key hashes. Prefixes are for display (`tops_sk_ab12…`).
- Keep `DATABASE_URL` in the environment, not in git.
- Backups contain all tenant data — encrypt and restrict them.
- Put HTTPS in front of the web and API listeners.
- Agent keys should be scoped (`tasks:read`, `tasks:move`, …).
- Leave `REGISTRATION_OPEN=false` in production. The first user may register;
  everyone else needs an invite from an org admin.
- Do not put the API on the public internet without TLS and a firewall.
