FROM php:8.1-apache

RUN a2enmod rewrite

RUN docker-php-ext-install mysqli pdo pdo_mysql

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions curl
