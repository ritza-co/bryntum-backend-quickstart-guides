<?php

use App\Http\Controllers\Api\SchedulerProController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/load', [SchedulerProController::class, 'load']);
Route::post('/sync', [SchedulerProController::class, 'sync']);