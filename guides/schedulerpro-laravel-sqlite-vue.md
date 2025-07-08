# How to Create a Vue Bryntum Scheduler Pro with Laravel and SQLite

This guide shows how to create a complete CRUD scheduler pro application using a TypeScript Vue Bryntum Scheduler Pro frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js 18+

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
cd frontend/schedulerpro-vue
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

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/schedulerpro/docs/guide/SchedulerPro/npm-repository). Once you've logged in to the registry, install the dependencies using the following command:

```shell
npm install
```

If you have a Bryntum Scheduler Pro license, install the Bryntum Scheduler Pro using the following command:

```shell
npm install @bryntum/schedulerpro @bryntum/schedulerpro-vue-3
```

If you don't have a Bryntum Scheduler Pro license, install the trial version:

```shell
npm install @bryntum/schedulerpro@npm:@bryntum/schedulerpro-trial @bryntum/schedulerpro-vue-3@npm:@bryntum/schedulerpro-vue-3-trial
```

#### Create Scheduler Pro Configuration

Create `src/schedulerProConfig.ts`:

```typescript
import { type SchedulerProConfig } from '@bryntum/schedulerpro';

export const schedulerProConfig: SchedulerProConfig = {
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

Update `src/App.vue`:

```vue
<script setup lang="ts">
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-vue-3';
import { schedulerProConfig } from './schedulerProConfig.ts';
</script>

<template>
    <bryntum-schedulerpro
        v-bind="schedulerProConfig"
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
    <title>How to use a Vue Bryntum Scheduler Pro with a backend API</title>
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
@import "@bryntum/schedulerpro/schedulerpro.stockholm.css";

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