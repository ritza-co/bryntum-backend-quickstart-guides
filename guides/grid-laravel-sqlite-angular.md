# How to Create an Angular Bryntum Grid with Laravel and SQLite

This guide shows how to create a complete CRUD Grid application using a TypeScript Angular Bryntum Grid frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

## Quick setup (run the existing app)

### Prerequisites

- PHP 8.1+
- Composer
- Node.js version 20 or higher

### Install and run backend

```bash
cd backend/laravel-sqlite-grid
composer install
php artisan migrate:fresh --seed
php artisan serve --port=1337
```

Backend runs on http://localhost:1337

### Install and run frontend

```bash
cd frontend/grid-angular
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir grid-laravel-sqlite-angular
cd grid-laravel-sqlite-angular
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
DB_DATABASE=/path-to-your-laravel-backend/database/database.sqlite
```

Create SQLite database:

```bash
touch database/database.sqlite
```

#### Create Data Files

Add example players data to `backend/data/players.json` (copy data from `example-json-data/grid/players.json`):

```json
[
  {
    "name": "Dan Jones",
    "city": "Los Angeles",
    "team": "Stockholm Eagles",
    "score": 430,
    "percentageWins": 30
  }
]
```

#### Create migrations

```bash
php artisan make:migration create_players_table
```

Update `database/migrations/xxxx_xx_xx_create_players_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('city')->nullable();
            $table->string('team')->nullable();
            $table->float('score')->default(0);
            $table->float('percentageWins')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
```

#### Create Eloquent Model

```bash
php artisan make:model Player
```

Update `app/Models/Player.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    protected $fillable = [
        'name', 'city', 'team', 'score', 'percentageWins'
    ];
    
    public $timestamps = false;
}
```

#### Create seeders

```bash
php artisan make:seeder PlayerSeeder
```

Update `database/seeders/PlayerSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Player;

class PlayerSeeder extends Seeder
{
    public function run(): void
    {
        $playersData = json_decode(file_get_contents(base_path('../../example-json-data/grid/players.json')), true);
        
        foreach ($playersData as $player) {
            Player::create($player);
        }
        
        echo "Players added to database successfully.\n";
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
            PlayerSeeder::class,
        ]);
    }
}
```

#### Create controller

```bash
php artisan make:controller Api/PlayerController
```

Update `app/Http/Controllers/Api/PlayerController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Player;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlayerController extends Controller
{
    public function read()
    {
        try {
            $players = Player::all();
            return response()->json([
                'success' => true,
                'data'    => $players,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Players data could not be read.',
            ], 500);
        }
    }

    public function create(Request $request)
    {
        try {
            $data = $request->input('data', []);

            // Perform all creates in a single transaction
            $createdPlayers = DB::transaction(function () use ($data) {
                $result = [];
                foreach ($data as $item) {
                    // Remove id from data as it will be auto-generated
                    unset($item['id']);
                    $player = Player::create($item);
                    $result[] = $player;
                }
                return $result;
            });

            return response()->json([
                'success' => true,
                'data'    => $createdPlayers,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Players could not be created',
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $data = $request->input('data', []);

            // Perform all updates in a single transaction
            $updatedPlayers = DB::transaction(function () use ($data) {
                $result = [];
                foreach ($data as $item) {
                    $id = $item['id'];
                    unset($item['id']);

                    $player = Player::findOrFail($id);
                    $player->update($item);
                    $result[] = $player;
                }
                return $result;
            });

            return response()->json([
                'success' => true,
                'data'    => $updatedPlayers,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Players could not be updated',
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        try {
            $ids = $request->input('ids', []);

            // Perform the delete operations in a single transaction
            DB::transaction(function () use ($ids) {
                Player::destroy($ids);
            });

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Could not delete selected player record(s)',
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

#### Create API routes

Update `routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PlayerController;

Route::get('/read', [PlayerController::class, 'read']);
Route::post('/create', [PlayerController::class, 'create']);
Route::patch('/update', [PlayerController::class, 'update']);
Route::delete('/delete', [PlayerController::class, 'delete']);
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npx @angular/cli@latest new . --routing --style=scss --package-manager=npm
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/grid/docs/guide/Grid/npm-repository). Once you've logged in to the registry, install the dependencies using the following command:

```shell
npm install
```

If you have a Bryntum Grid license, install the Bryntum Grid using the following command:

```shell
npm install @bryntum/grid @bryntum/grid-angular
```

If you don't have a Bryntum Grid license, install the trial version:

```shell
npm install @bryntum/grid@npm:@bryntum/grid-trial @bryntum/grid-angular@npm:@bryntum/grid-angular-trial
```

#### Create Grid Configuration

Create `src/app/app.config.ts`:

```typescript
import { AjaxStore } from '@bryntum/grid';
import type { BryntumGridProps } from '@bryntum/grid-angular';

const store = new AjaxStore({
    createUrl         : 'http://localhost:1337/api/create',
    readUrl           : 'http://localhost:1337/api/read',
    updateUrl         : 'http://localhost:1337/api/update',
    deleteUrl         : 'http://localhost:1337/api/delete',
    autoLoad          : true,
    autoCommit        : true,
    useRestfulMethods : true,
    httpMethods       : {
        read   : 'GET',
        create : 'POST',
        update : 'PATCH',
        delete : 'DELETE'
    }
});

export const gridConfig: BryntumGridProps = {
    store,
    columns : [
        { type : 'rownumber' },
        {
            text  : 'Name',
            field : 'name',
            width : 280
        },
        {
            text  : 'City',
            field : 'city',
            width : 220
        },
        {
            text  : 'Team',
            field : 'team',
            width : 270
        },
        {
            type  : 'number',
            text  : 'Score',
            field : 'score',
            width : 100
        },
        {
            type  : 'percent',
            text  : 'Percent wins',
            field : 'percentageWins',
            width : 200
        }
    ]
};
```

#### Update Main Application

Update `src/app/app.component.ts`:

```typescript
import { Component, ViewChild } from '@angular/core';
import { BryntumGridComponent } from '@bryntum/grid-angular';
import { gridConfig } from './app.config';

@Component({
    selector    : 'app-root',
    templateUrl : './app.component.html',
    standalone  : false,
    styleUrl    : './app.component.scss'
})
export class AppComponent {
    gridConfig = gridConfig;

    @ViewChild('app') gridComponent!: BryntumGridComponent;
}
```

Update `src/app/app.component.html`:

```html
<bryntum-grid
    #app
    [store]="gridConfig.store!"
    [columns] = "gridConfig.columns!"
></bryntum-grid>
```

#### Update app module

Update `src/app/app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BryntumGridModule } from '@bryntum/grid-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BryntumGridModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

#### Update Main Entry Point

Update `src/main.ts`:

```typescript
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
```

#### Update HTML

Update `src/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>How to use an Angular Bryntum Grid with a backend API</title>
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
@import "@bryntum/grid/grid.stockholm.css";

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

Visit http://localhost:5173 to see the Grid.