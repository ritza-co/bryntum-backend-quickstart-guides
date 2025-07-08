# How to Create an Angular Bryntum Scheduler Pro with Laravel and SQLite

This guide shows how to create a complete CRUD scheduler pro application using a TypeScript Angular Bryntum Scheduler Pro frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

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
cd frontend/schedulerpro-angular
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from Scratch

### Backend Setup

#### Initialize Backend

```bash
mkdir schedulerpro-laravel-sqlite-angular
cd schedulerpro-laravel-sqlite-angular
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

Add example events data to `backend/data/events.json` (copy data from `example-json-data/schedulerpro/events.json`):

```json
[
  {
    "id": 1,
    "startDate": "2025-10-20T09:00",
    "endDate": "2025-10-20T10:30",
    "name": "Conference call"
  }
]
```

Add example resources data to `backend/data/resources.json` (copy data from `example-json-data/schedulerpro/resources.json`):

```json
[
  { "id": 1, "name": "Peter" }
]
```

Add example assignments data to `backend/data/assignments.json` (copy data from `example-json-data/schedulerpro/assignments.json`):

```json
[
  { "id": 1, "eventId": 1, "resourceId": 1 }
]
```

Add example dependencies data to `backend/data/dependencies.json` (copy data from `example-json-data/schedulerpro/dependencies.json`):

```json
[
  { "id": 1, "from": 1, "to": 2 }
]
```

#### Create Migrations

```bash
php artisan make:migration create_events_table
php artisan make:migration create_resources_table
php artisan make:migration create_assignments_table
php artisan make:migration create_dependencies_table
```

Update migration files to match the Laravel backend models structure.

#### Create Eloquent Models

```bash
php artisan make:model Event
php artisan make:model Resource
php artisan make:model Assignment
php artisan make:model Dependency
```

Update the models according to the existing Laravel backend implementations.

#### Create Seeders

```bash
php artisan make:seeder EventSeeder
php artisan make:seeder ResourceSeeder
php artisan make:seeder AssignmentSeeder
php artisan make:seeder DependencySeeder
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
            EventSeeder::class,
            ResourceSeeder::class,
            AssignmentSeeder::class,
            DependencySeeder::class,
        ]);
    }
}
```

#### Create Controller

```bash
php artisan make:controller Api/SchedulerProController
```

Update `app/Http/Controllers/Api/SchedulerProController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Resource;
use App\Models\Assignment;
use App\Models\Dependency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchedulerProController extends Controller
{
    public function load()
    {
        try {
            $assignments = Assignment::all();
            $dependencies = Dependency::all();
            $events = Event::all();
            $resources = Resource::all();
            
            return response()->json([
                'assignments' => ['rows' => $assignments],
                'dependencies' => ['rows' => $dependencies],
                'events' => ['rows' => $events],
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
                $dependencies = $request->input('dependencies');
                $events = $request->input('events');
                $resources = $request->input('resources');
                
                $response = ['requestId' => $requestId, 'success' => true];
                $eventMapping = [];

                if ($resources) {
                    $rows = $this->applyTableChanges('resources', $resources);
                    if ($rows) {
                        $response['resources'] = ['rows' => $rows];
                    }
                }

                if ($events) {
                    $rows = $this->applyTableChanges('events', $events);
                    if ($rows) {
                        if (isset($events['added'])) {
                            foreach ($rows as $row) {
                                $eventMapping[$row['$PhantomId']] = $row['id'];
                            }
                        }
                        $response['events'] = ['rows' => $rows];
                    }
                }

                if ($assignments) {
                    if ($events && isset($events['added'])) {
                        foreach ($assignments['added'] as &$assignment) {
                            if (isset($eventMapping[$assignment['eventId']])) {
                                $assignment['eventId'] = $eventMapping[$assignment['eventId']];
                            }
                        }
                    }
                    $rows = $this->applyTableChanges('assignments', $assignments);
                    if ($rows) {
                        $response['assignments'] = ['rows' => $rows];
                    }
                }

                if ($dependencies) {
                    $rows = $this->applyTableChanges('dependencies', $dependencies);
                    if ($rows) {
                        $response['dependencies'] = ['rows' => $rows];
                    }
                }

                return response()->json($response);
            });
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'requestId' => $request->input('requestId'),
                'success' => false,
                'message' => 'There was an error syncing the data changes: ' . $e->getMessage(),
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
            
            if ($table === 'events') {
                $event = Event::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $event->id];
            } elseif ($table === 'resources') {
                $resource = Resource::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $resource->id];
            } elseif ($table === 'assignments') {
                $assignment = Assignment::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $assignment->id];
            } elseif ($table === 'dependencies') {
                $dependency = Dependency::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $dependency->id];
            }
        }
        
        return $results;
    }

    private function updateOperation($updated, $table)
    {
        foreach ($updated as $record) {
            $id = $record['id'];
            unset($record['id']);
            
            if ($table === 'events') {
                $fillableData = array_intersect_key($record, array_flip((new Event())->getFillable()));
                Event::where('id', $id)->update($fillableData);
            } elseif ($table === 'resources') {
                $fillableData = array_intersect_key($record, array_flip((new Resource())->getFillable()));
                Resource::where('id', $id)->update($fillableData);
            } elseif ($table === 'assignments') {
                $fillableData = array_intersect_key($record, array_flip((new Assignment())->getFillable()));
                Assignment::where('id', $id)->update($fillableData);
            } elseif ($table === 'dependencies') {
                $fillableData = array_intersect_key($record, array_flip((new Dependency())->getFillable()));
                Dependency::where('id', $id)->update($fillableData);
            }
        }
    }

    private function deleteOperation($deleted, $table)
    {
        foreach ($deleted as $record) {
            $id = $record['id'];
            
            if ($table === 'events') {
                Event::where('id', $id)->delete();
            } elseif ($table === 'resources') {
                Resource::where('id', $id)->delete();
            } elseif ($table === 'assignments') {
                Assignment::where('id', $id)->delete();
            } elseif ($table === 'dependencies') {
                Dependency::where('id', $id)->delete();
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
use App\Http\Controllers\Api\SchedulerProController;

Route::get('/load', [SchedulerProController::class, 'load']);
Route::post('/sync', [SchedulerProController::class, 'sync']);
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

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/schedulerpro/docs/guide/SchedulerPro/npm-repository).

If you have a Bryntum Scheduler Pro license, install the Bryntum Scheduler Pro using the following command:

```shell
npm install @bryntum/schedulerpro @bryntum/schedulerpro-angular
```

If you don't have a Bryntum Scheduler Pro license, install the trial version:

```shell
npm install @bryntum/schedulerpro@npm:@bryntum/schedulerpro-trial @bryntum/schedulerpro-angular@npm:@bryntum/schedulerpro-angular-trial
```

#### Update angular.json

Update `angular.json` to set the development server port to 5173:

```json
{
  ...
  "projects": {
    "schedulerpro-angular": {
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

#### Create Scheduler Pro Configuration

Create `src/app/app.config.ts`:

```typescript
import { BryntumSchedulerProProps } from '@bryntum/schedulerpro-angular';

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

#### Update App Component

Update `src/app/app.ts`:

```typescript
import { Component, ViewChild } from '@angular/core';
import { BryntumSchedulerProComponent } from '@bryntum/schedulerpro-angular';
import { schedulerProConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    schedulerProConfig = schedulerProConfig;

  @ViewChild('app') schedulerproComponent!: BryntumSchedulerProComponent;
}
```

#### Update App Template

Update `src/app/app.html`:

```html
<bryntum-schedulerpro
    #app
    [startDate]="schedulerProConfig.startDate!"
    [endDate]="schedulerProConfig.endDate!"
    [viewPreset]="schedulerProConfig.viewPreset!"
    [project]="schedulerProConfig.project!"
    [columns]="schedulerProConfig.columns!"
></bryntum-schedulerpro>
```

#### Update App Module

Update `src/app/app-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BryntumSchedulerProModule } from '@bryntum/schedulerpro-angular';

import { App } from './app';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        BryntumSchedulerProModule
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
  <title>How to use an Angular Bryntum Scheduler Pro with a backend API</title>
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
@import "@bryntum/schedulerpro/schedulerpro.stockholm.css";

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

Visit http://localhost:5173 to see the Scheduler Pro.