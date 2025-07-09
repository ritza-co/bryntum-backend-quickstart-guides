# How to Create a Vue Bryntum Calendar with Laravel and SQLite

This guide shows how to create a complete CRUD calendar application using a TypeScript Vue Bryntum Calendar frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick Setup (Run the Existing App)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js >= 20.0.0+

### Install & Run Backend

```bash
cd backend/laravel-sqlite-calendar
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install & Run Frontend

```bash
cd frontend/calendar-vue
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from Scratch

### Backend Setup

#### Initialize Backend

```bash
mkdir calendar-laravel-sqlite-vue
cd calendar-laravel-sqlite-vue
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

#### Create Migrations

```bash
php artisan make:migration create_resources_table
php artisan make:migration create_events_table
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
            $table->string('eventColor')->nullable();
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
            $table->unsignedBigInteger('resourceId');
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
            
            $table->foreign('resourceId')->references('id')->on('resources')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
```

#### Create Models

```bash
php artisan make:model Resource
php artisan make:model Event
```

Update `app/Models/Resource.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = ['name', 'eventColor'];
    
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
        'name', 'resourceId', 'readOnly', 'timeZone', 'draggable', 'resizable', 
        'children', 'allDay', 'duration', 'durationUnit', 'startDate', 'endDate',
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

#### Create Seeders

```bash
php artisan make:seeder ResourceSeeder
php artisan make:seeder EventSeeder
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
        $resources = json_decode(file_get_contents(base_path('../../example-json-data/calendar/resources.json')), true);
        
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
        $events = json_decode(file_get_contents(base_path('../../example-json-data/calendar/events.json')), true);
        
        foreach ($events as $event) {
            Event::create($event);
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
        ]);
    }
}
```

#### Create Controller

```bash
php artisan make:controller Api/CalendarController
```

Update `app/Http/Controllers/Api/CalendarController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Resource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CalendarController extends Controller
{
    public function load()
    {
        try {
            $events = Event::all();
            $resources = Resource::all();
            
            return response()->json([
                'events' => ['rows' => $events],
                'resources' => ['rows' => $resources],
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error loading the events and resources data.',
            ], 500);
        }
    }

    public function sync(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $requestId = $request->input('requestId');
                $events = $request->input('events');
                $resources = $request->input('resources');
                
                $response = ['requestId' => $requestId, 'success' => true];

                if ($resources) {
                    $rows = $this->applyTableChanges('resources', $resources);
                    if ($rows) {
                        $response['resources'] = ['rows' => $rows];
                    }
                }

                if ($events) {
                    $rows = $this->applyTableChanges('events', $events);
                    if ($rows) {
                        $response['events'] = ['rows' => $rows];
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
            
            if ($table === 'events') {
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
            
            if ($table === 'events') {
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
            
            if ($table === 'events') {
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

#### Create API Routes

Update `routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CalendarController;

Route::get('/load', [CalendarController::class, 'load']);
Route::post('/sync', [CalendarController::class, 'sync']);
```

### Frontend Setup

#### Initialize Frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vue@latest . -- --typescript --router false --pinia false --vitest false --cypress false --playwright false
```

#### Install Dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/calendar/docs/guide/Calendar/npm-repository).

If you have a Bryntum Calendar license, install the Bryntum Calendar using the following command:

```shell
npm install @bryntum/calendar @bryntum/calendar-vue
```

If you don't have a Bryntum Calendar license, install the trial version:

```shell
npm install @bryntum/calendar@npm:@bryntum/calendar-trial @bryntum/calendar-vue@npm:@bryntum/calendar-vue-trial
```

#### Update vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173
    }
});
```

#### Create Calendar Configuration

Create `src/calendarConfig.ts`:

```typescript
import { CalendarConfig } from '@bryntum/calendar';

export const calendarConfig: CalendarConfig = {
    crudManager: {
        loadUrl: 'http://localhost:1337/api/load',
        syncUrl: 'http://localhost:1337/api/sync',
        autoLoad: true,
        autoSync: true,
        validateResponse: true
    },
    
    sidebar: {
        items: {
            resourceFilter: {
                selected: []
            }
        }
    },
    
    modes: {
        day: true,
        week: true,
        month: true,
        year: true
    }
};
```

#### Update App Component

Update `src/App.vue`:

```vue
<template>
  <BryntumCalendar 
    ref="calendar" 
    v-bind="calendarConfig" 
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BryntumCalendar } from '@bryntum/calendar-vue';
import { calendarConfig } from './calendarConfig';

const calendar = ref(null);
</script>
```

#### Update Main Entry Point

Update `src/main.ts`:

```typescript
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

#### Update HTML

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>How to use a Vue Bryntum Calendar with a backend API</title>
    <link rel="stylesheet" href="./src/style.css">
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
@import "@bryntum/calendar/calendar.stockholm.css";

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
php artisan serve --port=1337

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the Calendar.