<?php

use App\Http\Controllers\Api\TaskBoardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/load', [TaskBoardController::class, 'load']);
Route::post('/sync', [TaskBoardController::class, 'sync']);