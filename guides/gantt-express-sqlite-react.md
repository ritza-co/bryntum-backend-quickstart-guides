# How to create a React Bryntum Gantt with Express and SQLite

This guide shows how to create a complete CRUD gantt chart application using a TypeScript React Bryntum Gantt frontend and an Express backend using Sequelize ORM and a local SQLite database.

## Quick setup (Run the Existing App)

### Prerequisites

- Node.js 18+

### Install & run backend

```bash
cd backend/express-sqlite-gantt
npm install
npm run seed
npm run dev
```

Backend runs on http://localhost:1337

### Install & run frontend

```bash
cd frontend/gantt-react
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir gantt-express-sqlite-react
cd gantt-express-sqlite-react
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
  "name": "gantt-express-sqlite-backend",
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

Add example tasks data to `backend/data/tasks.json` (copy data from `example-json-data/gantt/tasks.json`):

```json
[
  {
    "id": 1,
    "name": "Website Design",
    "percentDone": 30,
    "startDate": "2025-10-20",
    "rollup": true,
    "endDate": "2025-11-14",
    "expanded": true
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
    storage : './gantt.db'
});

export default sequelize;
```

#### Create Sequelize models

Create `models/Task.js`:

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define('Task', {
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
        type      : DataTypes.DATEONLY,
        allowNull : false
    },
    endDate : {
        type      : DataTypes.DATEONLY,
        allowNull : true
    },
    duration : {
        type      : DataTypes.INTEGER,
        allowNull : true
    },
    percentDone : {
        type         : DataTypes.INTEGER,
        defaultValue : 0
    },
    parentId : {
        type       : DataTypes.INTEGER,
        allowNull  : true,
        references : {
            model : 'Tasks',
            key   : 'id'
        }
    },
    expanded : {
        type         : DataTypes.BOOLEAN,
        defaultValue : false
    },
    rollup : {
        type         : DataTypes.BOOLEAN,
        defaultValue : false
    },
    manuallyScheduled : {
        type         : DataTypes.BOOLEAN,
        defaultValue : false
    }
}, {
    tableName : 'tasks'
});

// Define associations
Task.hasMany(Task, { as : 'children', foreignKey : 'parentId' });
Task.belongsTo(Task, { as : 'parent', foreignKey : 'parentId' });

export default Task;
```

Create `models/index.js`:

```javascript
import Task from './Task.js';

export { Task };
```

#### Create seed script

Create `addExampleData.js`:

```javascript
import { readFileSync } from 'fs';
import { Task } from './models/index.js';
import sequelize from './config/database.js';

async function setupDatabase() {
    // Wait for all models to synchronize with the database
    await sequelize.sync({ force : true });

    // Now add example data
    await addExampleData();
}

async function addExampleData() {
    try {
    // Read and parse the JSON data
        const tasksData = JSON.parse(readFileSync('../../example-json-data/gantt/tasks.json'));

        await sequelize.transaction(async(t) => {
            const tasks = await Task.bulkCreate(tasksData, { transaction : t });
            return { tasks };
        });

        console.log('Tasks added to database successfully.');
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
import { Task } from './models/index.js';
import sequelize from './config/database.js';
import process from 'process';

const app = express();
const PORT = process.env.PORT || 1337;

app.use(cors());
app.use(express.json());

// Initialize database
const initializeDatabase = async() => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Unable to connect to database:', error);
    }
};

// Bryntum CrudManager load endpoint
app.get('/api/load', async(req, res) => {
    try {
        const tasks = await Task.findAll({ order : [['id', 'ASC']] });

        res.json({
            success   : true,
            requestId : req.headers['x-request-id'] || Date.now(),
            revision  : 1,
            tasks     : {
                rows  : tasks,
                total : tasks.length
            }
        });
    }
    catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
});

// Bryntum CrudManager sync endpoint
app.post('/api/sync', async(req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const response = {
            success   : true,
            requestId : req.body.requestId || Date.now(),
            revision  : (req.body.revision || 0) + 1,
            tasks     : { rows : [], added : [], updated : [], removed : [] }
        };

        const { tasks } = req.body;

        // Process tasks
        if (tasks) {
            // Handle added tasks - map phantom IDs to real IDs
            if (tasks.added) {
                for (const task of tasks.added) {
                    const { $PhantomId, ...taskData } = task;
                    const newTask = await Task.create(taskData, { transaction });

                    // Return both phantom ID and real ID for client mapping
                    response.tasks.rows.push({
                        $PhantomId : $PhantomId,
                        id         : newTask.id,
                        ...newTask.toJSON()
                    });
                }
            }

            // Handle updated tasks - only return updated fields if server makes changes
            if (tasks.updated) {
                for (const task of tasks.updated) {
                    await Task.update(task, {
                        where : { id : task.id },
                        transaction
                    });
                }
            }

            // Handle removed tasks
            if (tasks.removed) {
                for (const task of tasks.removed) {
                    await Task.destroy({
                        where : { id : task.id },
                        transaction
                    });
                }
            }
        }

        await transaction.commit();
        res.json(response);
    }
    catch (error) {
        await transaction.rollback();
        console.error('Error syncing data:', error);
        res.status(500).json({
            success : false,
            message : error.message
        });
    }
});

app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vite@latest . -- --template react-ts
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/gantt/docs/guide/Gantt/npm-repository).

If you have a Bryntum Gantt license, install the Bryntum Gantt using the following command:

```shell
npm install @bryntum/gantt @bryntum/gantt-react
```

If you don't have a Bryntum Gantt license, install the trial version:

```shell
npm install @bryntum/gantt@npm:@bryntum/gantt-trial @bryntum/gantt-react@npm:@bryntum/gantt-react-trial
```

#### Update vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins : [react()],
    server  : {
        port : 5173
    }
});
```

#### Create Gantt configuration

Create `src/ganttConfig.ts`:

```typescript
import { BryntumGanttProps } from '@bryntum/gantt-react';

export const ganttConfig: BryntumGanttProps = {
    viewPreset : 'weekAndDayLetter',
    barMargin  : 10,
    project    : {
        taskStore : {
            transformFlatData : true
        },
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    },
    columns : [
        { type : 'name', field : 'name', text : 'Name', width : 250 },
        { type : 'startdate', field : 'startDate', text : 'Start Date' },
        { type : 'enddate', field : 'endDate', text : 'End Date' },
        { type : 'duration', field : 'fullDuration', text : 'Duration' },
        { type : 'percentdone', field : 'percentDone', text : '% Done', width : 80 }
    ]
};
```

#### Update main application

Update `src/App.tsx`:

```typescript
import { useRef } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import { ganttConfig } from './ganttConfig';

function App() {
    const gantt = useRef(null);

    return (
        <BryntumGantt ref={gantt} {...ganttConfig} />
    );
}

export default App;
```

#### Update main entry point

Update `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

#### Update HTML

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use Bryntum Gantt with a back end API</title>
    <link rel="stylesheet" href="./src/style.css">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### Update CSS styles

Update `src/style.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/gantt/gantt.stockholm.css";

* {
    margin: 0;
}

body,
html {
    font-family: Poppins, "Open Sans", Helvetica, Arial, sans-serif;
}
}

#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
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

Visit http://localhost:5173 to see the Gantt chart.