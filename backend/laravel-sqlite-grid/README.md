# Laravel backend for Bryntum Grid

This Laravel app has API endpoints to load grid data and sync data changes to a local SQLite database. It uses [Sequelize ORM](https://sequelize.org/).

## Getting started 

Install the dependencies using the following command:

```shell
composer install
```

Seed the database with the example players data:

```shell
php artisan db:seed
```

Run the local development server:

```shell
php artisan serve
```