# Team-Ops on Coolify
#
# 1. Create a PostgreSQL database.
# 2. Deploy the API image with DATABASE_URL and APP_URL.
# 3. Deploy the web image with API_URL pointing at the API service.
# 4. Put HTTPS on the public URL.
#
# Images (replace org after publish):
#   ghcr.io/team-ops/team-ops-api
#   ghcr.io/team-ops/team-ops-web
