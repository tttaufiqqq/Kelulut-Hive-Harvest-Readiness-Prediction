<?php

use App\Http\Controllers\SensorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| ESP32 sensor ingestion and other API endpoints go here.
| Routes are prefixed with /api automatically.
|
*/

Route::post('/sensor-data', [SensorController::class, 'store']);
Route::post('/internal/test-telegram-ready', [SensorController::class, 'testTelegramReady']);
