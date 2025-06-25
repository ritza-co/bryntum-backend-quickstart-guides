# How to create a Vue Bryntum Grid with Express and SQLite

This guide shows how to create a complete CRUD grid application using a TypeScript Vue Bryntum Grid frontend and an Express backend using Sequelize ORM and a local SQLite database.

## Quick setup (Run the Existing App)

### Prerequisites

- Node.js 18+

### Install & run backend

```bash
cd backend/express-sqlite-grid
npm install
npm run seed
npm run dev
```

Backend runs on http://localhost:1337

### Install & run frontend

```bash
cd frontend/grid-vue
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir grid-express-sqlite-vue
cd grid-express-sqlite-react
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
  "name": "grid-express-sqlite-backend",
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

Add example players data to `backend/data/players.json` (copy data from `example-json-data/grid/players.json`):

```json
[
  {
    "name": "Dan Jones",
    "city": "Los Angeles",
    "team": "Stockholm Eagles",
    "score": 430,
    "percentageWins": 30
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
    storage : './grid.sqlite3'
});

export default sequelize;
```

#### Create Sequelize models

Create `models/Player.js`:

```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Player = sequelize.define(
    'Player',
    {
        id : {
            type          : DataTypes.INTEGER,
            primaryKey    : true,
            autoIncrement : true
        },
        name : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        city : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        team : {
            type      : DataTypes.STRING,
            allowNull : true
        },
        score : {
            type         : DataTypes.FLOAT,
            defaultValue : 0
        },
        percentageWins : {
            type         : DataTypes.FLOAT,
            defaultValue : 0,
            max          : 100
        }
    },
    {
        tableName  : 'players',
        timestamps : false
    }
);

export default Player;
```

Create `models/index.js`:

```javascript
import Player from './Player.js';

export { Player };
```

#### Create seed script

Create `addExampleData.js`:

```javascript
import { readFileSync } from 'fs';
import sequelize from './config/database.js';
import { Player } from './models/index.js';

async function setupDatabase() {
    // Wait for all models to synchronize with the database
    await sequelize.sync({ force : true });

    // Now add example data
    await addExampleData();
}

async function addExampleData() {
    try {
    // Read and parse the JSON data
        const playersData = JSON.parse(readFileSync('../../example-json-data/grid/players.json'));

        await sequelize.transaction(async(t) => {
            const players = await Player.bulkCreate(playersData, { transaction : t });
            return { players };
        });

        console.log('Players added to database successfully.');
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
import Player from './models/Player.js';
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

app.get('/api/read', async(req, res) => {
    try {
        const players = await Player.findAll();

        res.send({
            success : true,
            data    : players
        });
    }
    catch (error) {
        console.error(error);
        res.send({
            success : false,
            message : 'Players data could not be read.'
        });
    }
});

app.post('/api/create', async(req, res) => {
    try {
        const { data } = req.body;

        // Perform all creates in a single transaction
        const result = await sequelize.transaction(async(t) => {
            const createdPlayers = [];

            for (const item of data) {
                // eslint-disable-next-line no-unused-vars
                const { id, ...playerData } = item;
                const newPlayer = await Player.create(playerData, { transaction : t });
                createdPlayers.push(newPlayer);
            }

            return createdPlayers;
        });

        res.send({ success : true, data : result });
    }
    catch (error) {
        console.error(error);
        res.send({
            success : false,
            message : 'Players could not be created'
        });
    }
});

app.patch('/api/update', async(req, res) => {
    try {
        const { data } = req.body;

        // Perform all updates in a single transaction
        const result = await sequelize.transaction(async(t) => {
            const updatedPlayers = [];

            for (const item of data) {
                const { id, ...updateData } = item;

                // Update the player
                const [updated] = await Player.update(updateData, {
                    where       : { id : id },
                    transaction : t
                });

                if (updated) {
                    // Fetch the updated player
                    const updatedPlayer = await Player.findOne({
                        where       : { id : id },
                        transaction : t
                    });
                    updatedPlayers.push(updatedPlayer);
                }
                else {
                    throw new Error(`Player with id ${id} not found`);
                }
            }

            return updatedPlayers;
        });

        res.send({ success : true, data : result });
    }
    catch (error) {
        console.error(error);
        res.send({
            success : false,
            message : 'Players could not be updated'
        });
    }
});

app.delete('/api/delete', async(req, res) => {
    try {
        const { ids } = req.body;

        // Perform the delete operations in a single transaction
        await sequelize.transaction(async(t) => {
            // Delete players whose ID is in the ids array
            await Player.destroy({
                where       : { id : ids },
                transaction : t
            });
        });

        res.send({ success : true });
    }
    catch (error) {
        console.error(error);
        const message = 'Could not delete selected player record(s)';
        res.send({
            success : false,
            message
        });
    }
});

app.listen(PORT, async() => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vue@latest . -- --yes --typescript --pwa=false --tests=false --eslint=false --prettier=false --pinia=false --vitest=false --cypress=false --playwright=false
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/grid/docs/guide/Grid/npm-repository). Once you've logged in to the registry, install the dependencies using the following command:

```shell
npm install
```

If you have a Bryntum Grid license, install the Bryntum Grid using the following command:

```shell
npm install @bryntum/grid @bryntum/grid-vue-3
```

If you don't have a Bryntum Grid license, install the trial version:

```shell
npm install @bryntum/grid@npm:@bryntum/grid-trial @bryntum/grid-vue-3@npm:@bryntum/grid-vue-3-trial
```

#### Create Grid configuration

Create `src/gridConfig.ts`:

```typescript
import { AjaxStore, type GridConfig } from '@bryntum/grid';

const store = new AjaxStore({
    createUrl         : 'http://localhost:1337/api/create',
    readUrl           : 'http://localhost:1337/api/read',
    updateUrl         : 'http://localhost:1337/api/update',
    deleteUrl         : 'http://localhost:1337/api/delete',
    autoLoad          : true,
    autoCommit        : true,
    useRestfulMethods : true,
    httpMethods       : {
        read   : 'GET',
        create : 'POST',
        update : 'PATCH',
        delete : 'DELETE'
    }
});

export const gridConfig: GridConfig = {
    store,
    columns : [
        { type : 'rownumber' },
        {
            text  : 'Name',
            field : 'name',
            width : 280
        },
        {
            text  : 'City',
            field : 'city',
            width : 220
        },
        {
            text  : 'Team',
            field : 'team',
            width : 270
        },
        {
            type  : 'number',
            text  : 'Score',
            field : 'score',
            width : 100
        },
        {
            type  : 'percent',
            text  : 'Percent wins',
            field : 'percentageWins',
            width : 200
        }
    ]
};
```

#### Update main application

Update `src/App.vue`:

```vue
<script setup lang="ts">
import { BryntumGrid } from '@bryntum/grid-vue-3';
import { gridConfig } from './gridConfig.ts';
</script>

<template>
    <bryntum-grid
        v-bind="gridConfig"
    />
</template>

<style lang="scss">
@import './assets/main.css';
</style>
```

#### Update main entry point

Update `src/main.ts`:

```typescript
import { createApp } from 'vue';
import App from './App.vue';

import './assets/main.css';

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
    <title>Bryntum Grid with Express and SQLite</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### Update CSS styles

Update `src/assets/main.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/grid/grid.stockholm.css";

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

Visit http://localhost:5173 to see the Grid.