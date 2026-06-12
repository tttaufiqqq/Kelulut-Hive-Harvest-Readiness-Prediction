<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Services\ReportingDataService;
use Inertia\Inertia;

class ReportingController extends Controller
{
    public function __construct(private readonly ReportingDataService $data) {}

    public function index()
    {
        $beekeeperId = auth()->id();
        $hives = Hive::where('beekeeper_id', $beekeeperId)->with(['species', 'site'])->get();

        return Inertia::render('reporting', $this->data->execute($beekeeperId, $hives));
    }
}
