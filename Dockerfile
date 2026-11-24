# syntax=docker/dockerfile:1.7
#
# BuzzyHive Laravel image. One image runs every Laravel role; only the command
# changes:
#   web        (default)  frankenphp, listens on :8080
#   worker                php artisan queue:work
#   scheduler             php artisan schedule:work   (compose) / schedule:run (Azure Job)
#   migrate               php artisan migrate --force
#
# Why each choice was made is written up in the infrastructure repository,
# docs/docker.md.

# Alpine by default: 333 MB against 900 MB for the Debian image, for about 10%
# less throughput (measured at 0.5 CPU, see docs/docker.md in the infra repo).
# The Node image must match the PHP image's C library, because Node is copied
# into the PHP stage. For the Debian build use:
#   --build-arg PHP_IMAGE=dunglas/frankenphp:1-php8.3-bookworm
#   --build-arg NODE_IMAGE=node:22-bookworm-slim
ARG PHP_IMAGE=dunglas/frankenphp:1-php8.3-alpine
ARG NODE_IMAGE=node:22-alpine

# Node comes from its own stage so it can be copied into the asset stage.
FROM ${NODE_IMAGE} AS node

# ---------------------------------------------------------------------------
# base: PHP + the three extensions the app needs on top of the image
#   pdo_mysql  database
#   opcache    compiled-script cache (the main speed-up for PHP)
#   pcntl      queue:work uses it to enforce job timeouts
# ---------------------------------------------------------------------------
FROM ${PHP_IMAGE} AS base
RUN install-php-extensions pdo_mysql opcache pcntl
WORKDIR /app

# ---------------------------------------------------------------------------
# vendor: production Composer dependencies, cached until composer.lock changes
# ---------------------------------------------------------------------------
FROM base AS vendor
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN install-php-extensions zip
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# ---------------------------------------------------------------------------
# assets: the Vite build. It needs PHP as well as Node, because the wayfinder
# plugin runs "php artisan wayfinder:generate" while building.
# ---------------------------------------------------------------------------
FROM base AS assets
ENV COMPOSER_ALLOW_SUPERUSER=1
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY --from=vendor /app/vendor ./vendor
COPY . .

# VITE_* values are compiled into the JavaScript, so they must exist at BUILD
# time (resources/js/app.tsx reads them). The Pusher key and cluster are public
# by design; the Pusher secret is never needed here and never enters the image.
ARG VITE_APP_NAME="BuzzyHive 2.0"
ARG VITE_PUSHER_APP_KEY=""
ARG VITE_PUSHER_APP_CLUSTER="ap1"
ARG VITE_PUSHER_HOST=""
ARG VITE_PUSHER_PORT="443"
ARG VITE_PUSHER_SCHEME="https"
ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_PUSHER_APP_KEY=$VITE_PUSHER_APP_KEY \
    VITE_PUSHER_APP_CLUSTER=$VITE_PUSHER_APP_CLUSTER \
    VITE_PUSHER_HOST=$VITE_PUSHER_HOST \
    VITE_PUSHER_PORT=$VITE_PUSHER_PORT \
    VITE_PUSHER_SCHEME=$VITE_PUSHER_SCHEME

RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && php artisan package:discover --ansi \
    && npm run build

# ---------------------------------------------------------------------------
# runtime: only what is needed to serve requests. No Node, no Composer, no
# tests, no JavaScript sources.
# ---------------------------------------------------------------------------
FROM base AS runtime

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    XDG_DATA_HOME=/data \
    XDG_CONFIG_HOME=/config

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-app.ini"
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

COPY artisan composer.json composer.lock ./
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY routes ./routes
COPY public ./public
COPY resources/views ./resources/views
COPY --from=assets /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build

# Warm everything that does not depend on runtime environment variables.
# config:cache is NOT run here: it runs at container start (entrypoint), so
# secrets injected by Azure end up in the cache and not the image.
RUN mkdir -p storage/app/public storage/app/private storage/framework/cache/data \
        storage/framework/sessions storage/framework/views storage/logs \
        bootstrap/cache /data /config \
    && php artisan package:discover --ansi \
    && php artisan storage:link \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan event:cache \
    && chown -R www-data:www-data storage bootstrap/cache /data /config

USER www-data
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
