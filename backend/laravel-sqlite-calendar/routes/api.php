<?php

use App\Http\Controllers\Api\CalendarController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/load', [CalendarController::class, 'load']);
Route::post('/sync', [CalendarController::class, 'sync']);