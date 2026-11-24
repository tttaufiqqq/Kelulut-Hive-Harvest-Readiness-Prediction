#!/bin/sh
# Runs before every container role (web, worker, scheduler, migrate).
set -e

# Cache the configuration now, not at build time, so the secrets Azure injects
# as environment variables are read once instead of on every request.
if [ -n "${APP_KEY:-}" ]; then
    php artisan config:cache --no-interaction > /dev/null
fi

exec "$@"
