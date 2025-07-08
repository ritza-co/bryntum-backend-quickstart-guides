<?php

use App\Http\Controllers\Api\SchedulerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/load', [SchedulerController::class, 'load']);
Route::post('/sync', [SchedulerController::class, 'sync']);