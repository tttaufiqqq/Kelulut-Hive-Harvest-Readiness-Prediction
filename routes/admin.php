<?php

use App\Http\Controllers\Admin\BeekeeperController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\HarvestController as AdminHarvestController;
use App\Http\Controllers\Admin\HiveController as AdminHiveController;
use App\Http\Controllers\Admin\InspectionController as AdminInspectionController;
use App\Http\Controllers\Admin\SensorDashboardController;
use App\Http\Controllers\Admin\SiteController;
use App\Http\Controllers\Admin\ThesisController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/beekeepers', [BeekeeperController::class, 'index'])->name('beekeepers.index');
    Route::post('/beekeepers', [BeekeeperController::class, 'store'])->name('beekeepers.store');
    Route::patch('/beekeepers/{user}', [BeekeeperController::class, 'update'])->name('beekeepers.update');
    Route::patch('/beekeepers/{user}/toggle-status', [BeekeeperController::class, 'toggleStatus'])->name('beekeepers.toggle-status');
    Route::post('/beekeepers/{user}/resend-invite', [BeekeeperController::class, 'resendInvite'])->name('beekeepers.resend-invite');
    Route::delete('/beekeepers/{user}', [BeekeeperController::class, 'destroy'])->name('beekeepers.destroy');

    Route::get('/sensors', [SensorDashboardController::class, 'index'])->name('sensors.index');

    Route::get('/thesis', [ThesisController::class, 'index'])->name('thesis');
    Route::post('/thesis', [ThesisController::class, 'upload'])->name('thesis.upload');
    Route::delete('/thesis', [ThesisController::class, 'destroy'])->name('thesis.destroy');

    Route::get('/sites', [SiteController::class, 'index'])->name('sites.index');
    Route::post('/sites', [SiteController::class, 'store'])->name('sites.store');
    Route::patch('/sites/{site}', [SiteController::class, 'update'])->name('sites.update');
    Route::delete('/sites/{site}', [SiteController::class, 'destroy'])->name('sites.destroy');

    Route::get('/hives', [AdminHiveController::class, 'index'])->name('hives.index');
    Route::post('/hives', [AdminHiveController::class, 'store'])->name('hives.store');
    Route::patch('/hives/{hive}', [AdminHiveController::class, 'update'])->name('hives.update');
    Route::delete('/hives/{hive}', [AdminHiveController::class, 'destroy'])->name('hives.destroy');
    Route::patch('/hives/{hive}/toggle-status', [AdminHiveController::class, 'toggleStatus'])->name('hives.toggle-status');

    Route::get('/harvests', [AdminHarvestController::class, 'index'])->name('harvests.index');

    Route::get('/inspections', [AdminInspectionController::class, 'index'])->name('inspections.index');
});
