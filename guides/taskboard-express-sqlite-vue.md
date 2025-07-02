# How to create a Vue Bryntum TaskBoard with Express and SQLite

This guide shows how to create a complete CRUD taskboard application using a TypeScript Vue Bryntum TaskBoard frontend and an Express backend using Sequelize ORM and a local SQLite database.

## Quick setup (Run the Existing App)

### Prerequisites

- Node.js 18+

### Install & run backend

```bash
cd backend/express-sqlite-taskboard
npm install
npm run seed
npm run dev
```

Backend runs on http://localhost:1337

### Install & run frontend

```bash
cd frontend/taskboard-vue
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir taskboard-express-sqlite-vue
cd taskboard-express-sqlite-vue
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
  "name": "taskboard-express-sqlite-backend",
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

Add example tasks data to `backend/data/tasks.json` (copy data from `example-json-data/taskboard/tasks.json`):

```json
[
  { "id": 1, "name": "Book flight", "status": "done", "prio": "medium" },
  { "id": 2, "name": "Book hotel", "status": "done", "prio": "medium" },
  { "id": 3, "name": "Pack bags", "status": "doing", "prio": "low" },
  ...
]
```

Add example resources data to `backend/data/resources.json` (copy data from `example-json-data/taskboard/resources.json`):

```json
[
  { "id": 1, "name": "Peter" },
  ...
]
```
Add example assignments data to `backend/data/assignments.json` (copy data from `example-json-data/taskboard/assignments.json`):

```json
[
  { "id": 1, "event": 1, "resource": 1 },
  ...
]
```

#### Create database configuration

Create `config/database.js`:

```javascript
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './taskboard.sqlite3'
});

export default sequelize;
```

#### Create Sequelize models

Create `models/Task.js`:

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define(
    'Task',
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
        eventColor : {
            type         : DataTypes.STRING,
            defaultValue : null
        },
        description : {
            type         : DataTypes.STRING,
            allowNull    : true,
            defaultValue : null
        },
        weight : {
            type         : DataTypes.INTEGER,
            allowNull    : false,
            defaultValue : 1
        },
        status : {
            type         : DataTypes.STRING,
            allowNull    : false,
            defaultValue : 'todo'
        },
        prio : {
            type         : DataTypes.STRING,
            allowNull    : false,
            defaultValue : 'medium'
        }
    },
    {
        tableName  : 'tasks',
        timestamps : false
    }
);

export default Task;
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
        event : {
            type       : DataTypes.INTEGER,
            allowNull  : false,
            references : {
                model : 'tasks',
                key   : 'id'
            },
            onDelete : 'CASCADE'
        },
        resource : {
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
                fields : ['event']
            },
            {
                fields : ['resource']
            }
        ]
    }
);

export default Assignment;
```

Create `models/index.js`:

```javascript
import Assignment from './Assignment.js';
import Task from './Task.js';
import Resource from './Resource.js';

export { Assignment, Task, Resource };
```

#### Create seed script

Create `addExampleData.js`:

```javascript
import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Assignment, Task, Resource } from './models/index.js';

async function setupDatabase() {
    await sequelize.sync({ force : true });
    await addExampleData();
}

async function addExampleData() {
    try {
        const tasksData = JSON.parse(readFileSync('../../example-json-data/taskboard/tasks.json'));
        const resourcesData = JSON.parse(readFileSync('../../example-json-data/taskboard/resources.json'));
        const assignmentsData = JSON.parse(readFileSync('../../example-json-data/taskboard/assignments.json'));

        await sequelize.transaction(async(t) => {
            await Task.bulkCreate(tasksData, { transaction : t });
            await Resource.bulkCreate(resourcesData, { transaction : t });
            await Assignment.bulkCreate(assignmentsData, { transaction : t });
        });

        console.log('Assignments, tasks, and resources added to database successfully.');
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
import { Assignment, Task, Resource } from './models/index.js';
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
        const tasksPromise = Task.findAll();
        const resourcesPromise = Resource.findAll();
        const [assignments, tasks, resources] = await Promise.all([
            assignmentsPromise,
            tasksPromise,
            resourcesPromise
        ]);
        res
            .send({
                assignments : { rows : assignments },
                tasks       : { rows : tasks },
                resources   : { rows : resources }
            })
            .status(200);
    }
    catch (error) {
        console.error({ error });
        res.send({
            success : false,
            message :
        'There was an error loading the assignments, tasks, and resources data.'
        });
    }
});

app.post('/api/sync', async function(req, res) {
    const { requestId, assignments, tasks, resources } = req.body;

    const taskMapping = {};

    try {
        const response = { requestId, success : true };

        if (resources) {
            const rows = await applyTableChanges('resources', resources);
            // if new data to update client
            if (rows) {
                response.resources = { rows };
            }
        }

        if (tasks) {
            const rows = await applyTableChanges('tasks', tasks);
            if (rows) {
                if (tasks?.added) {
                    rows.forEach((row) => {
                        taskMapping[row.$PhantomId] = row.id;
                    });
                }
                response.tasks = { rows };
            }
        }

        if (assignments) {
            if (tasks && tasks?.added) {
                assignments.added.forEach((assignment) => {
                    assignment.event = taskMapping[assignment.event];
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
            if (table === 'tasks') {
                const task = await Task.create(data);
                id = task.id;
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
            if (table === 'tasks') {
                await Task.update(data, { where : { id } });
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
            if (table === 'tasks') {
                await Task.destroy({
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
npm create vue@latest . -- --typescript --router false --pinia false --vitest false --cypress false --playwright false --eslint false
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/taskboard/docs/guide/TaskBoard/npm-repository).

If you have a Bryntum TaskBoard license, install the Bryntum TaskBoard using the following command:

```shell
npm install @bryntum/taskboard @bryntum/taskboard-vue-3
```

If you don't have a Bryntum TaskBoard license, install the trial version:

```shell
npm install @bryntum/taskboard@npm:@bryntum/taskboard-trial @bryntum/taskboard-vue-3@npm:@bryntum/taskboard-vue-3-trial
```

#### Update vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins : [vue()],
    server  : {
        port : 5173
    }
});
```

#### Create TaskBoard configuration

Create `src/taskboardConfig.ts`:

```typescript

import type { BryntumTaskBoardProps } from '@bryntum/taskboard-vue-3';

export const taskboardConfig: BryntumTaskBoardProps = {

    // Experimental, transition moving cards using the editor
    useDomTransition : true,

    // Columns to display
    columns : [
        { id : 'todo', text : 'Todo', color : 'orange' },
        { id : 'doing', text : 'Doing', color : 'blue', tooltip : 'Items that are currently in progress' },
        { id : 'done', text : 'Done' }
    ],

    // Field used to pair a task to a column
    columnField : 'status',

    project : {
        loadUrl  : 'http://localhost:1337/api/load',
        syncUrl  : 'http://localhost:1337/api/sync',
        autoLoad : true,
        autoSync : true
    }
};
```

#### Update main application

Update `src/App.vue`:

```vue
<script setup lang="ts">
import { BryntumTaskBoard } from '@bryntum/taskboard-vue-3';
import { taskboardConfig } from './taskboardConfig.ts';
</script>

<template>
    <bryntum-task-board
        v-bind="taskboardConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
```

#### Update CSS styles

Update `src/assets/main.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/taskboard/taskboard.stockholm.css";

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
```

#### Update HTML

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How to use a Vue Bryntum TaskBoard with a backend API</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
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

Visit http://localhost:5173 to see the TaskBoard.