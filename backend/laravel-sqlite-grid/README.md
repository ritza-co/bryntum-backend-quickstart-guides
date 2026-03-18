# Bryntum Grid Laravel API

A basic Laravel API for performing CRUD operations on a SQLite database. For use with a Bryntum Grid front end.

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

This will create a SQLite database file in the project directory with the players data.

## Run the API server

Run the Laravel development server:

```bash
composer run dev
```

The server will start on `http://localhost:1337`.

## API endpoints

### Read data

```
GET http://localhost:1337/api/read
```

Returns all players.

### Create a record

```
POST http://localhost:1337/api/create
```

Creates a new player record.

### Update a record

```
PATCH http://localhost:1337/api/update
```

Updates an existing player record.

### Delete a record

```
DELETE http://localhost:1337/api/delete
```

Deletes a player record.
