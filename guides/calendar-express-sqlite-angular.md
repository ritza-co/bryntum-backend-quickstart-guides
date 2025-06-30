# How to create a Bryntum Calendar with Express, SQLite and Angular

This guide shows how to create a complete CRUD calendar application using an Angular Bryntum Calendar frontend and an Express backend using Sequelize ORM and a local SQLite database.

## Quick setup (Run the Existing App)

### Prerequisites

- Node.js 18+

### Install & run backend

```bash
cd backend/express-sqlite-calendar
npm install
npm run seed
npm run dev
```

Backend runs on http://localhost:1337

### Install & run frontend

```bash
cd frontend/calendar-angular
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir calendar-express-sqlite-angular
cd calendar-express-sqlite-angular
mkdir backend
cd backend
npm init -y
```

#### Install dependencies

```bash
npm install express sequelize sqlite3 cors
npm install -D nodemon
```

#### Update package.json

```json
{
  "name": "calendar-express-sqlite-backend",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node addExampleData.js"
  }
  ...
}
```

#### Create data files

Add example events data to `backend/data/events.json` (copy data from `example-json-data/calendar/events.json`):

```json
[
  {
    "id": 1,
    "startDate": "2025-10-20T14:00:00",
    "endDate": "2025-10-27T12:00:00",
    "name": "Hackathon 2025",
    "allDay": true,
    "resourceId": "bryntum",
    "eventColor": "green"
  },
  ...
]
```

Add example resources data to `backend/data/resources.json` (copy data from `example-json-data/calendar/resources.json`):

```json
[
  {
    "id": "bryntum",
    "name": "Bryntum team",
    "eventColor": "blue"
  },
  ...
]
```

#### Create database configuration

Create `config/database.js`:

```javascript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './calendar.sqlite3'
});

export default sequelize;
```

#### Create Sequelize models

Create `models/Event.js`:

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Event = sequelize.define(
    'Event',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        },
        startDate : {
            type         : DataTypes.DATE,
            defaultValue : null
        },
        endDate : {
            type         : DataTypes.DATE,
            defaultValue : null
        },
        allDay : {
            type         : DataTypes.BOOLEAN,
            defaultValue : false
        },
        resourceId : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        eventColor : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        readOnly : {
            type         : DataTypes.BOOLEAN,
            defaultValue : false
        },
        timeZone : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        draggable : {
            type         : DataTypes.BOOLEAN,
            defaultValue : true
        },
        resizable : {
            type         : DataTypes.STRING,
            defaultValue : true
        },
        duration : {
            type         : DataTypes.INTEGER,
            defaultValue : null
        },
        durationUnit : {
            type         : DataTypes.STRING,
            defaultValue : 'day'
        },
        exceptionDates : {
            type         : DataTypes.JSON,
            defaultValue : null
        },
        recurrenceRule : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        cls : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        eventStyle : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        iconCls : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        style : {
            type         : DataTypes.STRING,
            defaultValue : null
        }
    },
    {
        tableName  : 'events',
        timestamps : false
    }
);

export default Event;
```

Create `models/Resource.js`:

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Resource = sequelize.define(
    'Resource',
    {
        id : {
            type      : DataTypes.STRING,
            primaryKey : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : false
        },
        eventColor : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        readOnly : {
            type         : DataTypes.BOOLEAN,
            defaultValue : false
        }
    },
    {
        tableName  : 'resources',
        timestamps : false
    }
);

export default Resource;
```

Create `models/index.js`:

```javascript
import Event from './Event.js';
import Resource from './Resource.js';

export { Event, Resource };
```

#### Create seed script

Create `addExampleData.js`:

```javascript
import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Event, Resource } from './models/index.js';

async function setupDatabase() {
    try {
        await Promise.all([
            Event.drop(),
            Resource.drop()
        ]);
        console.log('Existing tables dropped.');

        await sequelize.sync({ force : true });
        console.log('Database synced.');

        await addExampleData();
    }
    catch (error) {
        console.error('Failed to setup database: ', error);
    }
}

async function addExampleData() {
    try {
        const eventsData = JSON.parse(readFileSync('../../example-json-data/calendar/events.json'));
        const resourcesData = JSON.parse(readFileSync('../../example-json-data/calendar/resources.json'));

        await sequelize.transaction(async(t) => {
            const resources = await Resource.bulkCreate(resourcesData, { transaction : t });
            const events = await Event.bulkCreate(eventsData, { transaction : t });

            return { events, resources };
        });

        console.log('Events and resources added to database successfully.');
    }
    catch (error) {
        console.error('Failed to add data to database due to an error: ', error);
    }
}

setupDatabase();
```

#### Create server

Create `server.js`:

```javascript
import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import { Event, Resource } from './models/index.js';
import process from 'process';

const app = express();
const PORT = process.env.PORT || 1337;

app.use(cors(
    {
        origin : 'http://localhost:5173'
    }
));

app.use(express.json());

const initializeDatabase = async() => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Unable to connect to database:', error);
    }
};

app.get('/api/load', async(req, res) => {
    try {
        const eventsPromise = Event.findAll();
        const resourcesPromise = Resource.findAll();
        const [events, resources] = await Promise.all([
            eventsPromise,
            resourcesPromise
        ]);
        res
            .send({
                events    : { rows : events },
                resources : { rows : resources }
            })
            .status(200);
    }
    catch (error) {
        console.error({ error });
        res.send({
            success : false,
            message : 'There was an error loading the events and resources data.'
        });
    }
});

app.post('/api/sync', async function(req, res) {
    const { requestId, events, resources } = req.body;

    try {
        const response = { requestId, success : true };

        if (resources) {
            const rows = await applyTableChanges('resources', resources);
            if (rows) {
                response.resources = { rows };
            }
        }

        if (events) {
            const rows = await applyTableChanges('events', events);
            if (rows) {
                response.events = { rows };
            }
        }

        res.send(response);
    }
    catch (error) {
        console.error({ error });
        res.send({
            requestId,
            success : false,
            message : 'There was an error syncing the data changes.'
        });
    }
});

app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});

async function applyTableChanges(table, changes) {
    let rows;
    if (changes.added) {
        rows = await createOperation(changes.added, table);
    }
    if (changes.updated) {
        await updateOperation(changes.updated, table);
    }
    if (changes.removed) {
        await deleteOperation(changes.removed, table);
    }
    return rows;
}

function createOperation(added, table) {
    return Promise.all(
        added.map(async(record) => {
            const { $PhantomId, ...data } = record;
            let id;
            if (table === 'events') {
                const event = await Event.create(data);
                id = event.id;
            }
            if (table === 'resources') {
                const resource = await Resource.create(data);
                id = resource.id;
            }
            return { $PhantomId, id };
        })
    );
}

function updateOperation(updated, table) {
    return Promise.all(
        updated.map(async({ id, ...data }) => {
            if (table === 'events') {
                await Event.update(data, { where : { id } });
            }
            if (table === 'resources') {
                await Resource.update(data, { where : { id } });
            }
        })
    );
}

function deleteOperation(deleted, table) {
    return Promise.all(
        deleted.map(async({ id }) => {
            if (table === 'events') {
                await Event.destroy({
                    where : {
                        id : id
                    }
                });
            }
            if (table === 'resources') {
                await Resource.destroy({
                    where : {
                        id : id
                    }
                });
            }
        })
    );
}
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vite@latest . -- --template vanilla-ts
rm -rf src/*
```

#### Install dependencies

```bash
npm install @angular/animations @angular/common @angular/compiler @angular/core @angular/forms @angular/platform-browser @angular/platform-browser-dynamic @angular/router rxjs tslib zone.js
npm install -D @angular/cli @angular/compiler-cli @types/node typescript vite
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/calendar/docs/guide/Calendar/npm-repository).

If you have a Bryntum Calendar license, install the Bryntum Calendar using the following command:

```shell
npm install @bryntum/calendar @bryntum/calendar-angular
```

If you don't have a Bryntum Calendar license, install the trial version:

```shell
npm install @bryntum/calendar@npm:@bryntum/calendar-trial @bryntum/calendar-angular@npm:@bryntum/calendar-angular-trial
```

#### Create Calendar configuration

Create `src/calendarConfig.ts`:

```typescript
import { BryntumCalendarProps } from '@bryntum/calendar-angular';

export const calendarConfig: BryntumCalendarProps = {
    date        : new Date(2025, 9, 20),
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    }
};
```

#### Create Angular configuration files

Create `angular.json`:

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "calendar-angular": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/calendar-angular",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": [],
            "tsConfig": "tsconfig.app.json",
            "styles": [
              "src/styles.css"
            ],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "development": {
              "buildTarget": "calendar-angular:build:development"
            }
          },
          "defaultConfiguration": "development",
          "options": {
            "port": 5173
          }
        }
      }
    }
  }
}
```

Create `tsconfig.app.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}
```

Create `tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
```

#### Update package.json scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "ng serve",
    "build": "ng build",
    "preview": "vite preview"
  }
}
```

#### Create Angular components

Create `src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = {
    providers: []
};
```

Create `src/app/app.html`:

```html
<bryntum-calendar
    [date]="calendarConfig.date"
    [crudManager]="calendarConfig.crudManager">
</bryntum-calendar>
```

Create `src/app/app.css`:

```css
:host {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
}
```

Create `src/app/app.ts`:

```typescript
import { Component } from '@angular/core';
import { BryntumCalendarComponent } from '@bryntum/calendar-angular';
import { calendarConfig } from '../calendarConfig';

@Component({
    selector    : 'app-root',
    standalone  : true,
    imports     : [BryntumCalendarComponent],
    templateUrl : './app.html',
    styleUrl    : './app.css'
})
export class AppComponent {
    calendarConfig = calendarConfig;
}
```

Create `src/app/app-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BryntumCalendarModule } from '@bryntum/calendar-angular';
import { AppComponent } from './app';

@NgModule({
    declarations : [
        AppComponent
    ],
    imports : [
        BrowserModule,
        BryntumCalendarModule
    ],
    providers  : [],
    bootstrap  : [AppComponent]
})
export class AppModule { }
```

Create `src/app/app-routing-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
    imports : [RouterModule.forRoot(routes)],
    exports : [RouterModule]
})
export class AppRoutingModule { }
```

#### Update main entry point

Create `src/main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
```

#### Update HTML

Create `src/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use an Angular Bryntum Calendar with a backend API</title>
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

#### Update CSS styles

Create `src/styles.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/calendar/calendar.stockholm.css";

* {
    margin: 0;
}

body,
html {
    font-family: Poppins, "Open Sans", Helvetica, Arial, sans-serif;
}
```

### Run the application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the Calendar.