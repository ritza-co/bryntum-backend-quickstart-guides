# Laravel backend for Bryntum Gantt

This Laravel app has API endpoints to load Gantt data and sync data changes to a local SQLite database. It uses [Eloquent ORM](https://laravel.com/docs/eloquent).

## Getting started 

Install the dependencies using the following commands:

```shell
composer install
```

Seed the database with the example tasks data:

```shell
composer run seed
```

Run the local development server:

```shell
composer run dev
```