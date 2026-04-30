<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\AcceptInviteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HarvestController;
use App\Http\Controllers\HiveController;
use App\Http\Controllers\InspectionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $exists = \Illuminate\Support\Facades\Storage::disk('public')->exists('thesis/thesis.pdf');
    return inertia('LandingPage', [
        'thesisUrl' => $exists
            ? \Illuminate\Support\Facades\Storage::disk('public')->url('thesis/thesis.pdf')
            : null,
    ]);
})->name('home');

Route::middleware(['auth', 'verified', 'beekeeper'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('hives/{hive}/analytics', [AnalyticsController::class, 'show'])->name('analytics.show');

    Route::post('/hives', [HiveController::class, 'store'])->name('hives.store');
    Route::patch('/hives/{hive}', [HiveController::class, 'update'])->name('hives.update');
    Route::delete('/hives/{hive}', [HiveController::class, 'destroy'])->name('hives.destroy');
    Route::patch('/hives/{hive}/toggle-status', [HiveController::class, 'toggleStatus'])->name('hives.toggle-status');

    Route::get('/harvests', [HarvestController::class, 'index'])->name('harvests.index');
    Route::post('/harvests', [HarvestController::class, 'store'])->name('harvests.store');
    Route::patch('/harvests/{harvest}', [HarvestController::class, 'update'])->name('harvests.update');
    Route::delete('/harvests/{harvest}', [HarvestController::class, 'destroy'])->name('harvests.destroy');

    Route::get('/inspections', [InspectionController::class, 'index'])->name('inspections.index');
    Route::post('/inspections', [InspectionController::class, 'store'])->name('inspections.store');
    Route::patch('/inspections/{inspection}', [InspectionController::class, 'update'])->name('inspections.update');
    Route::delete('/inspections/{inspection}', [InspectionController::class, 'destroy'])->name('inspections.destroy');
});

// Invite acceptance — signed URL, no auth required
Route::get('invite/accept/{user}', [AcceptInviteController::class, 'show'])
    ->middleware('signed')
    ->name('invite.accept');

Route::post('invite/accept/{user}', [AcceptInviteController::class, 'store'])
    ->middleware('signed')
    ->name('invite.accept.store');

require __DIR__.'/settings.php';
