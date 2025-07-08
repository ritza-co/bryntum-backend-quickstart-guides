<?php

use App\Http\Controllers\Api\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/load', [TaskController::class, 'load']);
Route::post('/sync', [TaskController::class, 'sync']);