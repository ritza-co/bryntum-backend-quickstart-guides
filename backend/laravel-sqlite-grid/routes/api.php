<?php

use App\Http\Controllers\Api\PlayerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/read', [PlayerController::class, 'read']);
Route::post('/create', [PlayerController::class, 'create']);
Route::patch('/update', [PlayerController::class, 'update']);
Route::delete('/delete', [PlayerController::class, 'delete']);