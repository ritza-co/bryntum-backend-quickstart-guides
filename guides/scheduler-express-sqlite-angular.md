# How to create an Angular Bryntum Scheduler with Express and SQLite

This guide shows how to create a complete CRUD scheduler application using a TypeScript Angular Bryntum Scheduler frontend and an Express backend using Sequelize ORM and a local SQLite database.

## Quick setup (Run the Existing App)

### Prerequisites

- Node.js 18+

### Install & run backend

```bash
cd backend/express-sqlite-scheduler
npm install
npm run seed
npm run dev
```

Backend runs on http://localhost:1337

### Install & run frontend

```bash
cd frontend/scheduler-angular
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir scheduler-express-sqlite-angular
cd scheduler-express-sqlite-angular
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
  "name": "scheduler-express-sqlite-backend",
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

Add example events data to `backend/data/events.json` (copy data from `example-json-data/scheduler/events.json`):

```json
[
  {
    "id": 1,
    "startDate": "2025-10-20T09:00",
    "endDate": "2025-10-20T10:30",
    "name": "Conference call"
  },
  ...
]
```

Add example resources data to `backend/data/resources.json` (copy data from `example-json-data/scheduler/resources.json`):

```json
[
  { "id": 1, "name": "Peter" },
  ...
]
```
Add example assignments data to `backend/data/assignments.json` (copy data from `example-json-data/scheduler/assignments.json`):

```json
[
  { "id": 1, "eventId": 1, "resourceId": 1 },
  ...
]
```

#### Create database configuration

Create `config/database.js`:

```javascript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './scheduler.sqlite3'
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
        children : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        allDay : {
            type         : DataTypes.BOOLEAN,
            defaultValue : false
        },
        duration : {
            type         : DataTypes.INTEGER,
            defaultValue : null
        },
        durationUnit : {
            type         : DataTypes.STRING,
            defaultValue : 'day'
        },
        startDate : {
            type         : DataTypes.DATE,
            defaultValue : null
        },
        endDate : {
            type         : DataTypes.DATE,
            defaultValue : null
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
        eventColor : {
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

const Resource = sequelize.define('Resource', {
    id : {
        type          : DataTypes.INTEGER,
        primaryKey    : true,
        autoIncrement : true
    },
    name : {
        type      : DataTypes.STRING,
        allowNull : false
    }
}, {
    tableName : 'resources'
});

export default Resource;
```

Create `models/Assignment.js`:

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Assignment = sequelize.define(
    'Assignment',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        eventId : {
            type       : DataTypes.INTEGER,
            allowNull  : false,
            references : {
                model : 'events',
                key   : 'id'
            },
            onDelete : 'CASCADE'
        },
        resourceId : {
            type       : DataTypes.INTEGER,
            allowNull  : false,
            references : {
                model : 'resources',
                key   : 'id'
            },
            onDelete : 'CASCADE'
        }
    },
    {
        tableName  : 'assignments',
        timestamps : false,
        indexes    : [
            {
                fields : ['eventId']
            },
            {
                fields : ['resourceId']
            }
        ]
    }
);

export default Assignment;
```

Create `models/index.js`:

```javascript
import Assignment from './Assignment.js';
import Event from './Event.js';
import Resource from './Resource.js';

export { Assignment, Event, Resource };
```

#### Create seed script

Create `addExampleData.js`:

```javascript
import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Assignment, Event, Resource } from './models/index.js';

async function setupDatabase() {
    await sequelize.sync({ force : true });
    await addExampleData();
}

async function addExampleData() {
    try {
        const eventsData = JSON.parse(readFileSync('../../example-json-data/scheduler/events.json'));
        const resourcesData = JSON.parse(readFileSync('../../example-json-data/scheduler/resources.json'));
        const assignmentsData = JSON.parse(readFileSync('../../example-json-data/scheduler/assignments.json'));

        await sequelize.transaction(async(t) => {
            await Event.bulkCreate(eventsData, { transaction : t });
            await Resource.bulkCreate(resourcesData, { transaction : t });
            await Assignment.bulkCreate(assignmentsData, { transaction : t });
        });

        console.log('Assignments, events, and resources added to database successfully.');
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
import { Assignment, Event, Resource } from './models/index.js';
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
        const assignmentsPromise = Assignment.findAll();
        const eventsPromise = Event.findAll();
        const resourcesPromise = Resource.findAll();
        const [assignments, events, resources] = await Promise.all([
            assignmentsPromise,
            eventsPromise,
            resourcesPromise
        ]);
        res
            .send({
                assignments : { rows : assignments },
                events      : { rows : events },
                resources   : { rows : resources }
            })
            .status(200);
    }
    catch (error) {
        console.error({ error });
        res.send({
            success : false,
            message :
        'There was an error loading the assignments, events, and resources data.'
        });
    }
});

app.post('/api/sync', async function(req, res) {
    const { requestId, assignments, events, resources } = req.body;

    const eventMapping = {};

    try {
        const response = { requestId, success : true };

        if (resources) {
            const rows = await applyTableChanges('resources', resources);
            // if new data to update client
            if (rows) {
                response.resources = { rows };
            }
        }

        if (events) {
            const rows = await applyTableChanges('events', events);
            if (rows) {
                if (events?.added) {
                    rows.forEach((row) => {
                        eventMapping[row.$PhantomId] = row.id;
                    });
                }
                response.events = { rows };
            }
        }

        if (assignments) {
            if (events && events?.added) {
                assignments.added.forEach((assignment) => {
                    assignment.eventId = eventMapping[assignment.eventId];
                });
            }
            const rows = await applyTableChanges('assignments', assignments);
            if (rows) {
                response.assignments = { rows };
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
    // if got some new data to update client
    return rows;
}

function createOperation(added, table) {
    return Promise.all(
        added.map(async(record) => {
            const { $PhantomId, ...data } = record;
            let id;
            // Insert record into the table.rows array
            if (table === 'assignments') {
                const assignment = await Assignment.create(data);
                id = assignment.id;
            }
            if (table === 'events') {
                const event = await Event.create(data);
                id = event.id;
            }
            if (table === 'resources') {
                const resource = await Resource.create(data);
                id = resource.id;
            }
            // report to the client that we changed the record identifier
            return { $PhantomId, id };
        })
    );
}

function updateOperation(updated, table) {
    return Promise.all(
        updated.map(async({ id, ...data }) => {
            if (table === 'assignments') {
                await Assignment.update(data, { where : { id } });
            }
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
            if (table === 'assignments') {
                await Assignment.destroy({
                    where : {
                        id : id
                    }
                });
            }
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
npx @angular/cli@latest new . --routing=false --style=css --skip-git
```

#### Install dependencies

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/scheduler/docs/guide/Scheduler/npm-repository).

If you have a Bryntum Scheduler license, install the Bryntum Scheduler using the following command:

```shell
npm install @bryntum/scheduler @bryntum/scheduler-angular
```

If you don't have a Bryntum Scheduler license, install the trial version:

```shell
npm install @bryntum/scheduler@npm:@bryntum/scheduler-trial @bryntum/scheduler-angular@npm:@bryntum/scheduler-angular-trial
```

#### Update angular.json

Update `angular.json` to set the development server port to 5173:

```json
{
  ...
  "projects": {
    "scheduler-angular": {
      ...
      "architect": {
        "serve": {
          ...
          "options": {
            "port": 5173
          }
        }
      }
    }
  }
}
```

#### Create Scheduler configuration

Create `src/app/app.config.ts`:

```typescript
export const schedulerConfig = {
    startDate   : new Date(2025, 9, 20, 6),
    endDate     : new Date(2025, 9, 20, 20),
    viewPreset  : 'hourAndDay',
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
};
```

#### Update app component

Update `src/app/app.ts`:

```typescript
import { Component, ViewChild } from '@angular/core';
import { BryntumSchedulerComponent } from '@bryntum/scheduler-angular';
import { schedulerConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    schedulerConfig = schedulerConfig;

  @ViewChild('app') schedulerComponent!: BryntumSchedulerComponent;
}
```

#### Update app template

Update `src/app/app.html`:

```html
<bryntum-scheduler
    #app
    [columns]="schedulerConfig.columns"
    [startDate]="schedulerConfig.startDate"
    [endDate]="schedulerConfig.endDate"
    [viewPreset]="schedulerConfig.viewPreset"
    [crudManager]="schedulerConfig.crudManager"
></bryntum-scheduler>
```

#### Update app module

Update `src/app/app-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BryntumSchedulerModule } from '@bryntum/scheduler-angular';

import { App } from './app';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        BryntumSchedulerModule
    ],
    providers  : [],
    bootstrap  : [App]
})
export class AppModule { }
```

#### Update HTML

Update `src/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>How to use an Angular Bryntum Scheduler with a backend API</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

#### Update CSS styles

Update `src/styles.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/scheduler/scheduler.stockholm.css";

* {
    margin: 0;
}

body,
html {
    font-family: Poppins, "Open Sans", Helvetica, Arial, sans-serif;
}

app-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
}
```

#### Update package.json scripts

Update the dev script in `package.json`:

```json
{
  ...
  "scripts": {
    ...
    "dev": "ng serve --port 5173"
  }
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

Visit http://localhost:5173 to see the Scheduler.