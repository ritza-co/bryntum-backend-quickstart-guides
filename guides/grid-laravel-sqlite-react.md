# How to Create a React Bryntum Grid with Laravel and SQLite

This guide shows how to create a complete CRUD Grid application using a TypeScript React Bryntum Grid frontend and a Laravel backend using Eloquent ORM and a local SQLite database.

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
cd frontend/grid-react
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Build from scratch

### Backend setup

#### Initialize backend

```bash
mkdir grid-laravel-sqlite-react
cd grid-laravel-sqlite-react
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
            $table->string('name');
            $table->string('team');
            $table->integer('age');
            $table->string('position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
```

#### Create models

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
    protected $fillable = ['name', 'team', 'age', 'position'];
    
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
        $players = json_decode(file_get_contents(base_path('../../example-json-data/grid/players.json')), true);
        
        foreach ($players as $player) {
            Player::create($player);
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
use Illuminate\Support\Facades\Log;

class PlayerController extends Controller
{
    public function read()
    {
        try {
            $players = Player::all();
            
            return response()->json([
                'success' => true,
                'data' => $players,
                'total' => $players->count(),
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error loading the players data.',
            ], 500);
        }
    }

    public function create(Request $request)
    {
        try {
            $player = Player::create($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $player,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error creating the player.',
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $player = Player::findOrFail($id);
            $player->update($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $player,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error updating the player.',
            ], 500);
        }
    }

    public function delete($id)
    {
        try {
            $player = Player::findOrFail($id);
            $player->delete();
            
            return response()->json([
                'success' => true,
            ]);
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'There was an error deleting the player.',
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
Route::put('/update/{id}', [PlayerController::class, 'update']);
Route::delete('/delete/{id}', [PlayerController::class, 'delete']);
```

### Frontend setup

#### Initialize frontend

```bash
cd ../
mkdir frontend
cd frontend
npm create vite@latest . -- --template react-ts
```

#### Install dependencies

```bash
npm install
```

Follow the guide to accessing the [Bryntum npm repository](https://bryntum.com/products/grid/docs/guide/Grid/npm-repository).

If you have a Bryntum Grid license, install the Bryntum Grid using the following command:

```shell
npm install @bryntum/grid @bryntum/grid-react
```

If you don't have a Bryntum Grid license, install the trial version:

```shell
npm install @bryntum/grid@npm:@bryntum/grid-trial @bryntum/grid-react@npm:@bryntum/grid-react-trial
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

#### Create Grid Configuration

Create `src/gridConfig.ts`:

```typescript
import type { BryntumGridProps } from '@bryntum/grid-react';

export const gridConfig: BryntumGridProps = {
    store: {
        readUrl: 'http://localhost:1337/api/read',
        createUrl: 'http://localhost:1337/api/create',
        updateUrl: 'http://localhost:1337/api/update',
        deleteUrl: 'http://localhost:1337/api/delete',
        autoLoad: true,
        autoCommit: true,
        httpMethods: {
            create: 'POST',
            read: 'GET',
            update: 'PUT',
            delete: 'DELETE',
        },
    },
    
    columns: [
        { field: 'name', text: 'Name', flex: 1, editor: 'text' },
        { field: 'team', text: 'Team', flex: 1, editor: 'text' },
        { field: 'age', text: 'Age', width: 100, editor: 'number' },
        { field: 'position', text: 'Position', flex: 1, editor: 'text' }
    ],
    
    features: {
        cellEdit: true
    },
    
    tbar: {
        items: [
            {
                type: 'button',
                text: 'Add Player',
                icon: 'b-fa b-fa-plus',
                onClick: 'up.onAddPlayer'
            },
            {
                type: 'button',
                text: 'Remove Player',
                icon: 'b-fa b-fa-trash',
                onClick: 'up.onRemovePlayer'
            }
        ]
    }
};
```

#### Update Main Application

Update `src/App.tsx`:

```typescript
import { useRef } from 'react';
import { BryntumGrid } from '@bryntum/grid-react';
import { gridConfig } from './gridConfig';

function App() {
    const grid = useRef<any>(null);

    const onAddPlayer = () => {
        grid.current?.store.add({
            name: 'New Player',
            team: 'Team',
            age: 25,
            position: 'Position'
        });
    };

    const onRemovePlayer = () => {
        const selected = grid.current?.selectedRecord;
        if (selected) {
            selected.remove();
        }
    };

    return (
        <BryntumGrid 
            ref={grid} 
            {...gridConfig}
            onAddPlayer={onAddPlayer}
            onRemovePlayer={onRemovePlayer}
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
    <title>How to use a React Bryntum Grid with a backend API</title>
    <link rel="stylesheet" href="./src/style.css">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### Update CSS styles

Update `src/style.css`:

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
php artisan serve --port=1337

# Terminal 2: Start frontend  
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the Grid.