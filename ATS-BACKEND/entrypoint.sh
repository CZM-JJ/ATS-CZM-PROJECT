#!/bin/sh
set -e

cd /var/www

# Ensure .env exists
if [ ! -f ".env" ]; then
  cat > .env <<EOF
APP_NAME=ATS-CZM
APP_ENV=${APP_ENV:-local}
APP_KEY=
APP_DEBUG=${APP_DEBUG:-true}
APP_URL=${APP_URL:-http://localhost:8000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
LOG_CHANNEL=stack

DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-ats_db}
DB_USERNAME=${DB_USERNAME:-ats_user}
DB_PASSWORD=${DB_PASSWORD:-secret}

BROADCAST_DRIVER=log
CACHE_STORE=${CACHE_STORE:-redis}
CACHE_DRIVER=${CACHE_STORE:-redis}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-redis}
SESSION_DRIVER=${SESSION_DRIVER:-database}
REDIS_CLIENT=${REDIS_CLIENT:-phpredis}
REDIS_HOST=${REDIS_HOST:-redis}
REDIS_PORT=${REDIS_PORT:-6379}

MAIL_MAILER=${MAIL_MAILER:-smtp}
MAIL_HOST=${MAIL_HOST:-smtp.gmail.com}
MAIL_PORT=${MAIL_PORT:-587}
MAIL_ENCRYPTION=${MAIL_ENCRYPTION:-tls}
MAIL_USERNAME=${MAIL_USERNAME:-}
MAIL_PASSWORD=${MAIL_PASSWORD:-}
MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-hello@example.com}
MAIL_FROM_NAME=${MAIL_FROM_NAME:-Example}
SESSION_ENCRYPT=false
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SESSION_HTTP_ONLY=true
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
EOF
fi

# Generate APP_KEY if not set
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

# Run migrations (retry loop for DB readiness)
# Clear and cache config so env changes from the platform are applied
php artisan config:clear || true
php artisan cache:clear || true
php artisan config:cache || true

if [ "$DB_CONNECTION" != "sqlite" ]; then
  MAX_TRIES=15
  i=0
  until php artisan migrate --force; do
    i=$((i+1))
    if [ "$i" -ge "$MAX_TRIES" ]; then
      echo "Migrations failed after $i attempts"
      break
    fi
    echo "Waiting for DB... attempt $i/$MAX_TRIES"
    sleep 3
  done
else
  php artisan migrate --force || true
fi

chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 777 storage bootstrap/cache || true

exec "$@"
