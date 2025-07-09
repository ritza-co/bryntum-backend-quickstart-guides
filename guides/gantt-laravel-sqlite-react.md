# How to Create a React Bryntum Gantt with Laravel and SQLite

This guide shows how to create a complete CRUD gantt chart application using a TypeScript React Bryntum Gantt frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js >= 20.0.0+

### Install & Run Backend

```bash
cd backend/laravel-sqlite-gantt
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install & Run Frontend

```bash
cd frontend/gantt-react
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from Scratch

### Backend Setup

#### Initialize Backend

```bash
mkdir gantt-laravel-sqlite-react
cd gantt-laravel-sqlite-react
mkdir backend
cd backend
composer create-project laravel/laravel . --prefer-dist
```

#### Install Dependencies

```bash
composer install
```

#### Configure Database

Update `.env` to use SQLite:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/path-to-your-laravel-backend/database/database.sqlite
```

Create SQLite database:

```bash
touch database/database.sqlite
```

#### Create Data Files

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
  }
]
```

#### Create Migrations

```bash
php artisan make:migration create_tasks_table
```

Update `database/migrations/xxxx_xx_xx_create_tasks_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('startDate');
            $table->date('endDate')->nullable();
            $table->integer('duration')->nullable();
            $table->integer('percentDone')->default(0);
            $table->unsignedBigInteger('parentId')->nullable();
            $table->boolean('expanded')->default(false);
            $table->boolean('rollup')->default(false);
            $table->boolean('manuallyScheduled')->default(false);
            
            $table->foreign('parentId')->references('id')->on('tasks')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
```

#### Create Eloquent Model

```bash
php artisan make:model Task
```

Update `app/Models/Task.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'name', 'startDate', 'endDate', 'duration', 'percentDone',
        'parentId', 'expanded', 'rollup', 'manuallyScheduled'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'startDate' => 'date',
        'endDate' => 'date',
        'expanded' => 'boolean',
        'rollup' => 'boolean',
        'manuallyScheduled' => 'boolean',
    ];

    // Define relationships
    public function children()
    {
        return $this->hasMany(Task::class, 'parentId');
    }

    public function parent()
    {
        return $this->belongsTo(Task::class, 'parentId');
    }
}
```

#### Create Seeders

```bash
php artisan make:seeder TaskSeeder
```

Update `database/seeders/TaskSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $tasksData = json_decode(file_get_contents(base_path('../../example-json-data/gantt/tasks.json')), true);
        
        foreach ($tasksData as $task) {
            Task::create($task);
        }
        
        echo "Tasks added to database successfully.\n";
    }
}
```

Update `database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            TaskSeeder::class,
        ]);
    }
}
```

#### Create Controller

```bash
php artisan make:controller Api/TaskController
```

Update `app/Http/Controllers/Api/TaskController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    // Bryntum CrudManager load endpoint
    public function load()
    {
        try {
            $tasks = Task::orderBy('id', 'ASC')->get();
            
            return response()->json([
                'success' => true,
                'requestId' => request()->header('X-Request-Id') ?? time(),
                'revision' => 1,
                'tasks' => [
                    'rows' => $tasks,
                    'total' => $tasks->count(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // Bryntum CrudManager sync endpoint
    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $response = [
                    'success' => true,
                    'requestId' => $request->input('requestId') ?? time(),
                    'revision' => ($request->input('revision') ?? 0) + 1,
                    'tasks' => ['rows' => [], 'added' => [], 'updated' => [], 'removed' => []],
                ];

                $tasks = $request->input('tasks', []);

                // Handle added tasks - map phantom IDs to real IDs
                if (isset($tasks['added'])) {
                    foreach ($tasks['added'] as $task) {
                        $phantomId = $task['$PhantomId'] ?? null;
                        unset($task['$PhantomId']);
                        
                        $newTask = Task::create($task);
                        
                        // Return both phantom ID and real ID for client mapping
                        $taskData = $newTask->toArray();
                        if ($phantomId) {
                            $taskData['$PhantomId'] = $phantomId;
                        }
                        $response['tasks']['rows'][] = $taskData;
                    }
                }

                // Handle updated tasks - only return updated fields if server makes changes
                if (isset($tasks['updated'])) {
                    foreach ($tasks['updated'] as $task) {
                        $id = $task['id'];
                        unset($task['id']);
                        
                        // Filter to only include fillable fields
                        $fillableData = array_intersect_key($task, array_flip((new Task())->getFillable()));
                        
                        // Only update if there are fillable fields to update
                        if (!empty($fillableData)) {
                            Task::where('id', $id)->update($fillableData);
                        }
                    }
                }

                // Handle removed tasks
                if (isset($tasks['removed'])) {
                    foreach ($tasks['removed'] as $task) {
                        Task::where('id', $task['id'])->delete();
                    }
                }

                return response()->json($response);
            });
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
```

#### Configure CORS

Update `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

#### Create API Routes

Update `routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TaskController;

// Bryntum CrudManager endpoints
Route::get('/load', [TaskController::class, 'load']);
Route::post('/sync', [TaskController::class, 'sync']);
```

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

#### Create Gantt Configuration

Create `src/ganttConfig.ts`:

```typescript
import type { BryntumGanttProps } from '@bryntum/gantt-react';

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

#### Update Main Application

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
    <title>How to use a React Bryntum Gantt with a backend API</title>
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
@import "@bryntum/gantt/gantt.stockholm.css";

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

Visit http://localhost:5173 to see the Gantt chart.