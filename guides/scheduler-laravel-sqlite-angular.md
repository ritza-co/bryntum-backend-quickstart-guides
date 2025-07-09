# How to create an Angular Bryntum Scheduler with Laravel and SQLite

This guide shows how to create a complete CRUD scheduler application using a TypeScript Angular Bryntum Scheduler frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js 18+

### Install & run backend

```bash
cd backend/laravel-sqlite-scheduler
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install & run frontend

```bash
cd frontend/scheduler-angular
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir scheduler-laravel-sqlite-angular
cd scheduler-laravel-sqlite-angular
mkdir backend
cd backend
composer create-project laravel/laravel . --prefer-dist
```

#### Install dependencies

```bash
composer install
```

#### Configure database

Update `.env` to use SQLite:

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

Create SQLite database:

```bash
touch database/database.sqlite
```

#### Create migrations

```bash
php artisan make:migration create_resources_table
php artisan make:migration create_events_table
php artisan make:migration create_assignments_table
```

Update `database/migrations/xxxx_xx_xx_create_resources_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
```

Update `database/migrations/xxxx_xx_xx_create_events_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('readOnly')->default(false);
            $table->string('timeZone')->nullable();
            $table->boolean('draggable')->default(true);
            $table->string('resizable')->default('true');
            $table->string('children')->nullable();
            $table->boolean('allDay')->default(false);
            $table->integer('duration')->nullable();
            $table->string('durationUnit')->default('day');
            $table->dateTime('startDate')->nullable();
            $table->dateTime('endDate')->nullable();
            $table->json('exceptionDates')->nullable();
            $table->string('recurrenceRule')->nullable();
            $table->string('cls')->nullable();
            $table->string('eventColor')->nullable();
            $table->string('eventStyle')->nullable();
            $table->string('iconCls')->nullable();
            $table->string('style')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
```

Update `database/migrations/xxxx_xx_xx_create_assignments_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eventId');
            $table->unsignedBigInteger('resourceId');
            
            $table->foreign('eventId')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('resourceId')->references('id')->on('resources')->onDelete('cascade');
            
            $table->index(['eventId']);
            $table->index(['resourceId']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
```

#### Create models

```bash
php artisan make:model Resource
php artisan make:model Event
php artisan make:model Assignment
```

Update `app/Models/Resource.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = ['name'];
    
    public $timestamps = false;
}
```

Update `app/Models/Event.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'name', 'readOnly', 'timeZone', 'draggable', 'resizable', 'children',
        'allDay', 'duration', 'durationUnit', 'startDate', 'endDate',
        'exceptionDates', 'recurrenceRule', 'cls', 'eventColor', 'eventStyle',
        'iconCls', 'style'
    ];
    
    public $timestamps = false;
    
    protected $casts = [
        'readOnly' => 'boolean',
        'draggable' => 'boolean',
        'allDay' => 'boolean',
        'startDate' => 'datetime',
        'endDate' => 'datetime',
        'exceptionDates' => 'array',
    ];
}
```

Update `app/Models/Assignment.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    protected $fillable = ['eventId', 'resourceId'];
    
    public $timestamps = false;
}
```

#### Create seeders

```bash
php artisan make:seeder ResourceSeeder
php artisan make:seeder EventSeeder
php artisan make:seeder AssignmentSeeder
```

Update `database/seeders/ResourceSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Resource;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        $resources = json_decode(file_get_contents(base_path('../../example-json-data/scheduler/resources.json')), true);
        
        foreach ($resources as $resource) {
            Resource::create($resource);
        }
    }
}
```

Update `database/seeders/EventSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $events = json_decode(file_get_contents(base_path('../../example-json-data/scheduler/events.json')), true);
        
        foreach ($events as $event) {
            Event::create($event);
        }
    }
}
```

Update `database/seeders/AssignmentSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Assignment;

class AssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $assignments = json_decode(file_get_contents(base_path('../../example-json-data/scheduler/assignments.json')), true);
        
        foreach ($assignments as $assignment) {
            Assignment::create($assignment);
        }
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
            ResourceSeeder::class,
            EventSeeder::class,
            AssignmentSeeder::class,
        ]);
    }
}
```

#### Create controller

```bash
php artisan make:controller Api/SchedulerController
```

Update `app/Http/Controllers/Api/SchedulerController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Assignment;
use App\Models\Event;
use App\Models\Resource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchedulerController extends Controller
{
    public function load()
    {
        try {
            $assignments = Assignment::all();
            $events = Event::all();
            $resources = Resource::all();
            
            return response()->json([
                'assignments' => ['rows' => $assignments],
                'events' => ['rows' => $events],
                'resources' => ['rows' => $resources],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error loading the assignments, events, and resources data.',
            ], 500);
        }
    }

    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $requestId = $request->input('requestId');
                $assignments = $request->input('assignments');
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
            
            if ($table === 'assignments') {
                $assignment = Assignment::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $assignment->id];
            } elseif ($table === 'events') {
                $event = Event::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $event->id];
            } elseif ($table === 'resources') {
                $resource = Resource::create($record);
                $results[] = ['$PhantomId' => $phantomId, 'id' => $resource->id];
            }
        }
        
        return $results;
    }

    private function updateOperation($updated, $table)
    {
        foreach ($updated as $record) {
            $id = $record['id'];
            unset($record['id']);
            
            if ($table === 'assignments') {
                $fillableData = array_intersect_key($record, array_flip((new Assignment())->getFillable()));
                Assignment::where('id', $id)->update($fillableData);
            } elseif ($table === 'events') {
                $fillableData = array_intersect_key($record, array_flip((new Event())->getFillable()));
                Event::where('id', $id)->update($fillableData);
            } elseif ($table === 'resources') {
                $fillableData = array_intersect_key($record, array_flip((new Resource())->getFillable()));
                Resource::where('id', $id)->update($fillableData);
            }
        }
    }

    private function deleteOperation($deleted, $table)
    {
        foreach ($deleted as $record) {
            $id = $record['id'];
            
            if ($table === 'assignments') {
                Assignment::where('id', $id)->delete();
            } elseif ($table === 'events') {
                Event::where('id', $id)->delete();
            } elseif ($table === 'resources') {
                Resource::where('id', $id)->delete();
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

#### Create API routes

Update `routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SchedulerController;

Route::get('/load', [SchedulerController::class, 'load']);
Route::post('/sync', [SchedulerController::class, 'sync']);
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npx @angular/cli@latest new . --routing=false --style=css --skip-git
```

#### Install dependencies

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/scheduler/docs/guide/Scheduler/npm-repository).

If you have a Bryntum Scheduler license, install the Bryntum Scheduler using the following command:

```shell
npm install @bryntum/scheduler @bryntum/scheduler-angular
```

If you don't have a Bryntum Scheduler license, install the trial version:

```shell
npm install @bryntum/scheduler@npm:@bryntum/scheduler-trial @bryntum/scheduler-angular@npm:@bryntum/scheduler-angular-trial
```

#### Update angular.json

Update `angular.json` to set the development server port to 5173:

```json
{
  ...
  "projects": {
    "scheduler-angular": {
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

#### Create Scheduler configuration

Create `src/app/app.config.ts`:

```typescript
import type { BryntumSchedulerProps } from '@bryntum/scheduler-angular';

export const schedulerConfig: BryntumSchedulerProps = {
    startDate   : new Date(2025, 9, 20, 6),
    endDate     : new Date(2025, 9, 20, 20),
    viewPreset  : 'hourAndDay',
    crudManager : {
        loadUrl          : 'http://localhost:1337/api/load',
        autoLoad         : true,
        syncUrl          : 'http://localhost:1337/api/sync',
        autoSync         : true,
        validateResponse : true
    },
    columns : [{ text : 'Name', field : 'name', width : 130 }]
};
```

#### Update app component

Update `src/app/app.ts`:

```typescript
import { Component, ViewChild } from '@angular/core';
import { BryntumSchedulerComponent } from '@bryntum/scheduler-angular';
import { schedulerConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.html',
    standalone  : false,
    styleUrl    : './app.css'
})
export class App {
    schedulerConfig = schedulerConfig;

  @ViewChild('app') schedulerComponent!: BryntumSchedulerComponent;
}
```

#### Update app template

Update `src/app/app.html`:

```html
<bryntum-scheduler
    #app
    [startDate]="schedulerConfig.startDate!"
    [endDate]="schedulerConfig.endDate!"
    [viewPreset]="schedulerConfig.viewPreset!"
    [crudManager]="schedulerConfig.crudManager!"
    [columns]="schedulerConfig.columns!"
></bryntum-scheduler>
```

#### Update app module

Update `src/app/app-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BryntumSchedulerModule } from '@bryntum/scheduler-angular';

import { App } from './app';

@NgModule({
    declarations : [
        App
    ],
    imports : [
        BrowserModule,
        BryntumSchedulerModule
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
  <title>How to use an Angular Bryntum Scheduler with a backend API</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

#### Update CSS styles

Update `src/styles.css`:

```css
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
@import "@bryntum/scheduler/scheduler.stockholm.css";

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

#### Update package.json scripts

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

### Run the application

```bash
# Terminal 1: Start backend
cd backend
php artisan serve --port=1337

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the Scheduler.