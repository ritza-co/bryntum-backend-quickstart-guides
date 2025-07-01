# Express backend for Bryntum Scheduler Pro

This Express app has API endpoints to load events, resources, assignments, and dependencies data and sync data changes to a local SQLite database. It uses [Sequelize ORM](https://sequelize.org/).

## Getting started 

Install the dependencies using the following command:

```shell
npm install
```

Seed the database with the example events, resources, assignments, and dependencies data:

```shell
npm run seed
```

Run the local development server:

```shell
npm run dev
```