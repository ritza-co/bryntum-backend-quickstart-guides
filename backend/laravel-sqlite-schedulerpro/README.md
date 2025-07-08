# Laravel backend for Bryntum Scheduler Pro

This Laravel app has API endpoints to load Scheduler Pro data and sync data changes to a local SQLite database. It uses [Eloquent ORM](https://laravel.com/docs/eloquent).

## Getting started 

Install the dependencies using the following commands:

```shell
composer install
```

Seed the database with the example events, resources, assignments, and dependencies data:

```shell
composer run seed
```

Run the local development server:

```shell
composer run dev
```