# How to Create a Bryntum Task Board with Laravel and SQLite

This guide shows how to create a complete CRUD Task Board application using a TypeScript Bryntum Task Board frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick setup (run the existing app)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js version 20 or higher

### Install and run backend

```bash
cd backend/laravel-sqlite-taskboard
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install and run frontend

```bash
cd frontend/taskboard-vanilla
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

Refer to the backend setup section in the Angular guide above, as the Laravel backend implementation is identical across all frontend frameworks.

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vite@latest . -- --template vanilla-ts
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/taskboard/docs/guide/TaskBoard/npm-repository). Once you've logged in to the registry, install the dependencies using the following command:

```shell
npm install
```

If you have a Bryntum Task Board license, install the Bryntum Task Board using the following command:

```shell
npm install @bryntum/taskboard
```

If you don't have a Bryntum Task Board license, install the trial version:

```shell
npm install @bryntum/taskboard@npm:@bryntum/taskboard-trial
```

#### Create Task Board Configuration

Create `src/taskboardConfig.ts`:

```typescript
import { type TaskBoardConfig } from '@bryntum/taskboard';

export const taskboardConfig: TaskBoardConfig = {
    appendTo : 'app',

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

Update `src/main.ts`:

```typescript
import { TaskBoard } from '@bryntum/taskboard';
import { taskboardConfig } from './taskboardConfig';
import './style.css';

const taskboard = new TaskBoard(taskboardConfig);
```

#### Update HTML

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use a Vanilla Bryntum Task Board with a backend API</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### Update CSS styles

Update `src/style.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "../node_modules/@bryntum/taskboard/taskboard.stockholm.css";

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

### Run the application

```bash
# Terminal 1: Start backend
cd backend
php artisan migrate:fresh --seed
php artisan serve --port=1337

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the Task Board.