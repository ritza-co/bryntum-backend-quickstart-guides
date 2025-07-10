# How to Create a Vue Bryntum TaskBoard with Laravel and SQLite

This guide shows how to create a complete CRUD taskboard application using a TypeScript Vue Bryntum TaskBoard frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js version 20 or higher

### Install & Run Backend

```bash
cd backend/laravel-sqlite-taskboard
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install & Run Frontend

```bash
cd frontend/taskboard-vue
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from Scratch

### Backend Setup

Refer to the backend setup section in the Angular guide above, as the Laravel backend implementation is identical across all frontend frameworks.

### Frontend Setup

#### Initialize Frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vue@latest . -- --yes --typescript --pwa=false --tests=false --eslint=false --prettier=false --pinia=false --vitest=false --cypress=false --playwright=false
```

#### Install Dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/taskboard/docs/guide/TaskBoard/npm-repository). Once you've logged in to the registry, install the dependencies using the following command:

```shell
npm install
```

If you have a Bryntum TaskBoard license, install the Bryntum TaskBoard using the following command:

```shell
npm install @bryntum/taskboard @bryntum/taskboard-vue-3
```

If you don't have a Bryntum TaskBoard license, install the trial version:

```shell
npm install @bryntum/taskboard@npm:@bryntum/taskboard-trial @bryntum/taskboard-vue-3@npm:@bryntum/taskboard-vue-3-trial
```

#### Create TaskBoard Configuration

Create `src/taskboardConfig.ts`:

```typescript
import { type TaskBoardConfig } from '@bryntum/taskboard';

export const taskboardConfig: TaskBoardConfig = {

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

#### Update Main Application

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

#### Update Main Entry Point

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
    <title>How to use a Vue Bryntum TaskBoard with a backend API</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### Update CSS Styles

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

### Run the Application

```bash
# Terminal 1: Start backend
cd backend
php artisan migrate:fresh --seed
php artisan serve --port=1337

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the TaskBoard.