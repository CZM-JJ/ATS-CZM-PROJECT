#!/bin/sh
set -e

cd /var/www

# Ensure .env exists
if [ ! -f ".env" ]; then
  cp .env.example .env
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
