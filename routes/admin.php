<?php

use App\Http\Controllers\Admin\BeekeeperController;
use App\Http\Controllers\Admin\HarvestController as AdminHarvestController;
use App\Http\Controllers\Admin\SensorDashboardController;
use App\Http\Controllers\Admin\ThesisController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/', function () {
        $stats = User::role('beekeeper')
            ->selectRaw("COUNT(*) as total, SUM(status = 'pending') as pending, SUM(status = 'active') as active")
            ->first();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total'   => (int) $stats->total,
                'pending' => (int) $stats->pending,
                'active'  => (int) $stats->active,
            ],
        ]);
    })->name('dashboard');

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

    Route::get('/harvests', [AdminHarvestController::class, 'index'])->name('harvests.index');
});
