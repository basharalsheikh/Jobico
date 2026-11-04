# Stage 1: Build frontend assets
FROM node:24-alpine AS frontend

WORKDIR /var/www/html

COPY package.json package-lock.json ./

RUN npm ci \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000

COPY . .

RUN npm run build


# Stage 2: Shared PHP base
FROM php:8.2-fpm-bookworm AS php-base

RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        exif \
        gd \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html


# Stage 3: Install PHP dependencies
FROM php-base AS vendor

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

ENV COMPOSER_MAX_PARALLEL_HTTP=2

RUN php -d default_socket_timeout=900 /usr/bin/composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts


# Stage 4: PHP application
FROM php-base AS app

COPY . .

COPY --from=vendor /var/www/html/vendor ./vendor

COPY --from=frontend /var/www/html/public/build ./public/build

RUN mkdir -p \
    storage/app/public \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && ln -s ../storage/app/public public/storage \
    && chown -R www-data:www-data storage bootstrap/cache

   RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php \
    && php artisan package:discover --ansi

EXPOSE 9000

CMD ["php-fpm"]


# Stage 5: Nginx web server
FROM nginx:alpine AS web

WORKDIR /var/www/html

COPY --from=app /var/www/html/public ./public

RUN mkdir -p /var/www/html/storage/app/public

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
