# Bryntum Task Board Laravel API

A basic Laravel API for performing CRUD operations on a SQLite database. For use with a Bryntum Task Board front end.

## Install dependencies

Run the following command to install the project dependencies:

```bash
composer install
```

## Seed the database

Run the following command to create the SQLite database and populate it with example data:

```bash
composer run seed
```

This will create a SQLite database file in the project directory with the tasks, resources, and assignments data.

## Run the API server

Run the Laravel development server:

```bash
composer run dev
```

The server will start on `http://localhost:1337`.

## API endpoints

### Load data

```
GET http://localhost:1337/api/load
```

Returns all tasks, resources, and assignments.

### Sync data

```
POST http://localhost:1337/api/sync
```

Syncs changes (added, updated, removed) for tasks, resources, and assignments.
