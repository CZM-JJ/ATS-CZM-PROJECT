FROM php:8.2-fpm-alpine

WORKDIR /var/www

RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    autoconf \
    bash \
    curl \
    git \
    icu-dev \
    libzip-dev \
    libxml2-dev \
    oniguruma-dev \
    postgresql-dev \
    sqlite-dev \
    zip \
    unzip \
    libpq \
    && docker-php-ext-install \
    intl \
    mbstring \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    pdo_sqlite \
    pcntl \
    bcmath \
    xml \
    zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Copy dependency files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install \
    --no-dev \
    --no-interaction \
    --optimize-autoloader

# Copy application code
COPY . .

# Ensure permissions for runtime files
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache || true

# Copy and setup entrypoint
COPY --chmod=755 entrypoint.sh .

# Create storage directories with proper permissions
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["sh", "-c", "php -d variables_order=EGPCS artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
