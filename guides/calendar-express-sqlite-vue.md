# How to create a Bryntum Calendar with Express, SQLite and Vue

This guide shows how to create a complete CRUD calendar application using a Vue Bryntum Calendar frontend and an Express backend using Sequelize ORM and a local SQLite database.

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
cd frontend/calendar-vue
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir calendar-express-sqlite-vue
cd calendar-express-sqlite-vue
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
npm create vue@latest . -- --typescript --router false --pinia false --tests false --eslint false --prettier false
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/calendar/docs/guide/Calendar/npm-repository).

If you have a Bryntum Calendar license, install the Bryntum Calendar using the following command:

```shell
npm install @bryntum/calendar @bryntum/calendar-vue-3
```

If you don't have a Bryntum Calendar license, install the trial version:

```shell
npm install @bryntum/calendar@npm:@bryntum/calendar-trial @bryntum/calendar-vue-3@npm:@bryntum/calendar-vue-3-trial
```

#### Create Calendar configuration

Create `src/calendarConfig.ts`:

```typescript
import { BryntumCalendarProps } from '@bryntum/calendar-vue-3';

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

#### Update main Vue component

Update `src/App.vue`:

```vue
<template>
    <div id="app">
        <BryntumCalendar v-bind="calendarConfig" />
    </div>
</template>

<script setup lang="ts">
import { BryntumCalendar } from '@bryntum/calendar-vue-3';
import { calendarConfig } from './calendarConfig';
</script>

<style>
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/calendar/calendar.stockholm.css";

* {
    margin: 0;
}

body,
html {
    font-family: Poppins, "Open Sans", Helvetica, Arial, sans-serif;
}

#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
}
</style>
```

#### Update main entry point

Update `src/main.ts`:

```typescript
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

#### Update HTML

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use a Vue Bryntum Calendar with a backend API</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### Update package.json scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite --port 5173",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
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

Visit http://localhost:5173 to see the Calendar.