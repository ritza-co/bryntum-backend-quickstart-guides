# How to Create an Angular Bryntum TaskBoard with Laravel and SQLite

This guide shows how to create a complete CRUD taskboard application using a TypeScript Angular Bryntum TaskBoard frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js >= 20.0.0+

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
cd frontend/taskboard-angular
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from Scratch

### Backend Setup

#### Initialize Backend

```bash
mkdir taskboard-laravel-sqlite-angular
cd taskboard-laravel-sqlite-angular
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
DB_DATABASE=database/database.sqlite
```

Create SQLite database:

```bash
touch database/database.sqlite
```

#### Create Data Files

Add example tasks data to `backend/data/tasks.json` (copy data from `example-json-data/taskboard/tasks.json`):

```json
[
  { "id": 1, "name": "Book flight", "status": "done", "prio": "medium" },
  { "id": 2, "name": "Book hotel", "status": "done", "prio": "medium" },
  { "id": 3, "name": "Pack bags", "status": "doing", "prio": "low" }
]
```

Add example resources data to `backend/data/resources.json` (copy data from `example-json-data/taskboard/resources.json`):

```json
[
  { "id": 1, "name": "Peter" }
]
```

Add example assignments data to `backend/data/assignments.json` (copy data from `example-json-data/taskboard/assignments.json`):

```json
[
  { "id": 1, "event": 1, "resource": 1 }
]
```

#### Create Migrations

```bash
php artisan make:migration create_tasks_table
php artisan make:migration create_resources_table
php artisan make:migration create_assignments_table
```

Update migration files to match the Laravel backend models structure.

#### Create Eloquent Models

```bash
php artisan make:model Task
php artisan make:model Resource
php artisan make:model Assignment
```

Update the models according to the existing Laravel TaskBoard backend implementation.

#### Create Seeders

```bash
php artisan make:seeder TaskSeeder
php artisan make:seeder ResourceSeeder
php artisan make:seeder AssignmentSeeder
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
            ResourceSeeder::class,
            AssignmentSeeder::class,
        ]);
    }
}
```

#### Create Controller

```bash
php artisan make:controller Api/TaskBoardController
```

Update `app/Http/Controllers/Api/TaskBoardController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Resource;
use App\Models\Assignment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TaskBoardController extends Controller
{
    public function load()
    {
        try {
            $assignments = Assignment::all();
            $tasks = Task::all();
            $resources = Resource::all();
            
            return response()->json([
                'assignments' => ['rows' => $assignments],
                'tasks' => ['rows' => $tasks],
                'resources' => ['rows' => $resources],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error loading the data.',
            ], 500);
        }
    }

    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $requestId = $request->input('requestId');
                $assignments = $request->input('assignments');
                $tasks = $request->input('tasks');
                $resources = $request->input('resources');
                
                $response = ['requestId' => $requestId, 'success' => true];

                if ($resources) {
                    $rows = $this->applyTableChanges('resources', $resources);
                    if ($rows) {
                        $response['resources'] = ['rows' => $rows];
                    }
                }

                if ($tasks) {
                    $rows = $this->applyTableChanges('tasks', $tasks);
                    if ($rows) {
                        $response['tasks'] = ['rows' => $rows];
                    }
                }

                if ($assignments) {
                    $rows = $this->applyTableChanges('assignments', $assignments);
                    if ($rows) {
                        $response['assignments'] = ['rows' => $rows];
                    }
                }

                return response()->json($response);
            });
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'requestId' => $request->input('requestId'),
                'success' => false,
                'message' => 'There was an error syncing the data changes.',
            ], 500);
        }
    }

    private function applyTableChanges($table, $changes)
    {
        $rows = null;
        
        if (isset($changes['added'])) {
            $rows = $this->createOperation($changes['added'], $table);
        }
        
        if (isset($changes['updated'])) {
            $this->updateOperation($changes['updated'], $table);
        }
        
        if (isset($changes['removed'])) {
            $this->deleteOperation($changes['removed'], $table);
        }
        
        return $rows;
    }

    private function createOperation($added, $table)
    {
        $results = [];
        
        foreach ($added as $record) {
            $phantomId = $record['$PhantomId'] ?? null;
            unset($record['$PhantomId']);
            
            if ($table === 'tasks') {
                $task = Task::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $task->id];
            } elseif ($table === 'resources') {
                $resource = Resource::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $resource->id];
            } elseif ($table === 'assignments') {
                $assignment = Assignment::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $assignment->id];
            }
        }
        
        return $results;
    }

    private function updateOperation($updated, $table)
    {
        foreach ($updated as $record) {
            $id = $record['id'];
            unset($record['id']);
            
            if ($table === 'tasks') {
                $fillableData = array_intersect_key($record, array_flip((new Task())->getFillable()));
                Task::where('id', $id)->update($fillableData);
            } elseif ($table === 'resources') {
                $fillableData = array_intersect_key($record, array_flip((new Resource())->getFillable()));
                Resource::where('id', $id)->update($fillableData);
            } elseif ($table === 'assignments') {
                $fillableData = array_intersect_key($record, array_flip((new Assignment())->getFillable()));
                Assignment::where('id', $id)->update($fillableData);
            }
        }
    }

    private function deleteOperation($deleted, $table)
    {
        foreach ($deleted as $record) {
            $id = $record['id'];
            
            if ($table === 'tasks') {
                Task::where('id', $id)->delete();
            } elseif ($table === 'resources') {
                Resource::where('id', $id)->delete();
            } elseif ($table === 'assignments') {
                Assignment::where('id', $id)->delete();
            }
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
use App\Http\Controllers\Api\TaskBoardController;

Route::get('/load', [TaskBoardController::class, 'load']);
Route::post('/sync', [TaskBoardController::class, 'sync']);
```

### Frontend Setup

#### Initialize Frontend

```bash
cd ../
mkdir frontend
cd frontend
npx @angular/cli@latest new . --routing=false --style=css --skip-git
```

#### Install Dependencies

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/taskboard/docs/guide/TaskBoard/npm-repository).

If you have a Bryntum TaskBoard license, install the Bryntum TaskBoard using the following command:

```shell
npm install @bryntum/taskboard @bryntum/taskboard-angular
```

If you don't have a Bryntum TaskBoard license, install the trial version:

```shell
npm install @bryntum/taskboard@npm:@bryntum/taskboard-trial @bryntum/taskboard-angular@npm:@bryntum/taskboard-angular-trial
```

#### Update angular.json

Update `angular.json` to set the development server port to 5173:

```json
{
  ...
  "projects": {
    "taskboard-angular": {
      ...
      "architect": {
        "serve": {
          ...
          "options": {
            "port": 5173
          }
        }
      }
    }
  }
}
```

#### Create TaskBoard Configuration

Create `src/app/app.config.ts`:

```typescript
import type { BryntumTaskBoardProps } from '@bryntum/taskboard-angular';

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

#### Update App Component

Update `src/app/app.ts`:

```typescript
import { Component, ViewChild } from '@angular/core';
import { BryntumTaskBoardComponent } from '@bryntum/taskboard-angular';
import { taskboardConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    taskboardConfig = taskboardConfig;

  @ViewChild('app') taskboardComponent!: BryntumTaskBoardComponent;
}
```

#### Update App Template

Update `src/app/app.html`:

```html
<bryntum-task-board
    #app
    [useDomTransition] = "taskboardConfig.useDomTransition!"
    [columns] = "taskboardConfig.columns!"
    [columnField] = "taskboardConfig.columnField!"
    [project] = "taskboardConfig.project!"
></bryntum-task-board>
```

#### Update App Module

Update `src/app/app-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BryntumTaskBoardModule } from '@bryntum/taskboard-angular';

import { App } from './app';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        BryntumTaskBoardModule
    ],
    providers  : [],
    bootstrap  : [App]
})
export class AppModule { }
```

#### Update HTML

Update `src/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>How to use an Angular Bryntum TaskBoard with a backend API</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

#### Update CSS Styles

Update `src/styles.css`:

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

app-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-size: 14px;
}
```

#### Update package.json Scripts

Update the dev script in `package.json`:

```json
{
  ...
  "scripts": {
    ...
    "dev": "ng serve --port 5173"
  }
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