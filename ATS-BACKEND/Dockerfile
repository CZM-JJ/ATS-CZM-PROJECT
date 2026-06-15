FROM php:8.4-fpm-alpine

WORKDIR /var/www

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    icu-libs \
    libzip \
    libpq \
    libpng \
    libjpeg-turbo \
    freetype \
    zip \
    unzip

# Install build-only dependencies
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    autoconf \
    icu-dev \
    libzip-dev \
    libxml2-dev \
    oniguruma-dev \
    postgresql-dev \
    sqlite-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
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
    gd \
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
    --no-scripts \
    --no-dev \
    --no-interaction \
    --optimize-autoloader

# Copy application code
COPY . .

# Run composer scripts now that the application code (and artisan) is available
RUN composer dump-autoload --optimize --no-dev

# Ensure permissions for runtime files
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache || true

# Copy and setup entrypoint to a location outside the volume mount
COPY --chmod=755 entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh

# Create storage directories with proper permissions
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["sh", "-c", "php -d variables_order=EGPCS artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
