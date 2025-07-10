# How to Create a React Bryntum Scheduler Pro with Laravel and SQLite

This guide shows how to create a complete CRUD scheduler pro application using a TypeScript React Bryntum Scheduler Pro frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js version 20 or higher

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
cd frontend/schedulerpro-react
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
npm create vite@latest . -- --template react-ts
```

#### Install Dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/schedulerpro/docs/guide/SchedulerPro/npm-repository).

If you have a Bryntum Scheduler Pro license, install the Bryntum Scheduler Pro using the following command:

```shell
npm install @bryntum/schedulerpro @bryntum/schedulerpro-react
```

If you don't have a Bryntum Scheduler Pro license, install the trial version:

```shell
npm install @bryntum/schedulerpro@npm:@bryntum/schedulerpro-trial @bryntum/schedulerpro-react@npm:@bryntum/schedulerpro-react-trial
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

#### Create Scheduler Pro Configuration

Create `src/schedulerProConfig.ts`:

```typescript
import type { BryntumSchedulerProProps } from '@bryntum/schedulerpro-react';

export const schedulerProConfig: BryntumSchedulerProProps = {
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

Update `src/App.tsx`:

```typescript
import { useRef } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { schedulerProConfig } from './schedulerProConfig';

function App() {
    const schedulerPro = useRef<any>(null);

    return (
        <BryntumSchedulerPro 
            ref={schedulerPro} 
            {...schedulerProConfig}
        />
    );
}

export default App;
```

#### Update Main Entry Point

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
    <title>How to use a React Bryntum Scheduler Pro with a backend API</title>
    <link rel="stylesheet" href="./src/style.css">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### Update CSS Styles

Update `src/style.css`:

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