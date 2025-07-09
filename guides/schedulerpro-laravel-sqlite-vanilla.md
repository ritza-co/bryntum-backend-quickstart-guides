# How to Create a Bryntum Scheduler Pro with Laravel and SQLite

This guide shows how to create a complete CRUD scheduler pro application using a TypeScript Bryntum Scheduler Pro frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js >= 20.0.0+

### Install & Run Backend

```bash
cd backend/laravel-sqlite-schedulerpro
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install & Run Frontend

```bash
cd frontend/schedulerpro-vanilla
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
npm create vite@latest . -- --template vanilla-ts
```

#### Install Dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/schedulerpro/docs/guide/SchedulerPro/npm-repository). Once you've logged in to the registry, install the dependencies using the following command:

```shell
npm install
```

If you have a Bryntum Scheduler Pro license, install the Bryntum Scheduler Pro using the following command:

```shell
npm install @bryntum/schedulerpro
```

If you don't have a Bryntum Scheduler Pro license, install the trial version:

```shell
npm install @bryntum/schedulerpro@npm:@bryntum/schedulerpro-trial
```

#### Create Scheduler Pro Configuration

Create `src/schedulerProConfig.ts`:

```typescript
import { type SchedulerProConfig } from '@bryntum/schedulerpro';

export const schedulerProConfig: SchedulerProConfig = {
    appendTo   : 'app',
    startDate  : new Date(2025, 9, 20, 6),
    endDate    : new Date(2025, 9, 20, 20),
    viewPreset : 'hourAndDay',
    project    : {
        autoLoad  : true,
        autoSync  : true,
        transport : {
            load : {
                url : 'http://localhost:1337/api/load'
            },
            sync : {
                url : 'http://localhost:1337/api/sync'
            }
        }
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
};
```

#### Update Main Application

Update `src/main.ts`:

```typescript
import { SchedulerPro } from '@bryntum/schedulerpro';
import { schedulerProConfig } from './schedulerProConfig';
import './style.css';

const schedulerPro = new SchedulerPro(schedulerProConfig);
```

#### Update HTML

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use a Vanilla Bryntum Scheduler Pro with a backend API</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### Update CSS Styles

Update `src/style.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "../node_modules/@bryntum/schedulerpro/schedulerpro.stockholm.css";

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

Visit http://localhost:5173 to see the Scheduler Pro.