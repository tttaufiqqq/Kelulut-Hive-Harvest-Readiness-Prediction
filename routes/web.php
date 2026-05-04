<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Auth\AcceptInviteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HarvestController;
use App\Http\Controllers\InspectionController;
use App\Http\Controllers\PredictionController;
use App\Http\Controllers\ReportingController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    $exists = Storage::disk('public')->exists('thesis/thesis.pdf');

    return inertia('LandingPage', [
        'thesisUrl' => $exists ? route('thesis.pdf') : null,
    ]);
})->name('home');

Route::get('/thesis/pdf', function () {
    abort_unless(Storage::disk('public')->exists('thesis/thesis.pdf'), 404);

    return Storage::disk('public')->response('thesis/thesis.pdf', 'BuzzyHive-2.0-Thesis.pdf', [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="BuzzyHive-2.0-Thesis.pdf"',
    ]);
})->name('thesis.pdf');

Route::middleware(['auth', 'verified', 'beekeeper'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('hives/{hive}/analytics', [AnalyticsController::class, 'show'])->name('analytics.show');
    Route::get('hives/{hive}/predictions/live', [PredictionController::class, 'show'])->name('predictions.live');

    Route::get('/harvests', [HarvestController::class, 'index'])->name('harvests.index');
    Route::post('/harvests', [HarvestController::class, 'store'])->name('harvests.store');
    Route::patch('/harvests/{harvest}', [HarvestController::class, 'update'])->name('harvests.update');
    Route::delete('/harvests/{harvest}', [HarvestController::class, 'destroy'])->name('harvests.destroy');

    Route::get('/inspections', [InspectionController::class, 'index'])->name('inspections.index');
    Route::post('/inspections', [InspectionController::class, 'store'])->name('inspections.store');
    Route::patch('/inspections/{inspection}', [InspectionController::class, 'update'])->name('inspections.update');
    Route::delete('/inspections/{inspection}', [InspectionController::class, 'destroy'])->name('inspections.destroy');

    Route::get('/reporting', [ReportingController::class, 'index'])->name('reporting.index');
});

// Invite acceptance — signed URL, no auth required
Route::get('invite/accept/{user}', [AcceptInviteController::class, 'show'])
    ->middleware('signed')
    ->name('invite.accept');

Route::post('invite/accept/{user}', [AcceptInviteController::class, 'store'])
    ->middleware('signed')
    ->name('invite.accept.store');

require __DIR__.'/settings.php';
