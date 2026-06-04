#!/bin/bash
# ============================================================
# ATS Full-Stack Production Deploy Script
# Run this from the root directory on your Linux server:
# sudo bash ATS-BACKEND/deployment/deploy.sh
# ============================================================

set -e

# 1. Ensure we are in the project root
# This script expects to be run from the directory containing /frontend and /ATS-BACKEND
PROJECT_ROOT=$(pwd)
echo "==> Project Root: $PROJECT_ROOT"

echo "==> Pulling latest code from GitHub..."
git pull origin main

# ------------------------------------------------------------
# FRONTEND UPDATE
# ------------------------------------------------------------
echo "==> Updating Frontend..."
if [ -d "frontend" ]; then
    cd frontend
    echo "Installing frontend dependencies..."
    npm install
    echo "Building frontend assets..."
    npm run build
    cd "$PROJECT_ROOT"
else
    echo "Error: frontend directory not found!"
    exit 1
fi

# ------------------------------------------------------------
# BACKEND UPDATE
# ------------------------------------------------------------
echo "==> Updating Backend..."
if [ -d "ATS-BACKEND" ]; then
    cd ATS-BACKEND
    echo "Installing Composer dependencies..."
    composer install --no-dev --optimize-autoloader

    echo "Caching configuration and routes..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache

    echo "Running database migrations..."
    php artisan migrate --force

    echo "Clearing caches..."
    php artisan cache:clear
    php artisan queue:restart

    echo "Setting specific storage permissions..."
    chmod -R 775 storage bootstrap/cache
    chown -R www-data:www-data storage bootstrap/cache

    cd "$PROJECT_ROOT"
else
    echo "Error: ATS-BACKEND directory not found!"
    exit 1
fi

# ------------------------------------------------------------
# FINAL SYSTEM SYNC
# ------------------------------------------------------------
echo "==> Finalizing permissions..."
# Ensure the entire project is owned by the web server to avoid 403/500 errors
# and the "dubious ownership" git error.
chown -R www-data:www-data "$PROJECT_ROOT"

echo "==> Reloading Supervisor workers..."
# Using sudo here because supervisorctl usually requires root
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart ats-worker:* || echo "No worker found, skipping..."

echo ""
echo "------------------------------------------------------------"
echo "🚀 Deploy complete! Frontend and Backend are now updated."
echo "------------------------------------------------------------"
