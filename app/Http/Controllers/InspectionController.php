<?php

namespace App\Http\Controllers;

use App\Http\Requests\Inspection\StoreInspectionRequest;
use App\Http\Requests\Inspection\UpdateInspectionRequest;
use App\Models\Inspection;
use App\Models\Hive;
use App\Models\MasterWeatherCondition;
use App\Models\MasterFloraType;
use Inertia\Inertia;

class InspectionController extends Controller
{
    public function index()
    {
        $query = Inspection::where('beekeeper_id', auth()->id())
            ->with(['hive', 'weatherConditions', 'floraTypes'])
            ->latest('inspection_date');

        if (request()->filled('hive_id')) {
            $query->where('hive_id', request('hive_id'));
        }

        $inspections = $query->paginate(15)->withQueryString();

        $hives = Hive::where('beekeeper_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('inspections/index', [
            'inspections'      => $inspections,
            'hives'            => $hives,
            'weatherConditions' => MasterWeatherCondition::orderBy('name')->get(['id', 'name']),
            'floraTypes'       => MasterFloraType::orderBy('name')->get(['id', 'name']),
            'filters'          => request()->only('hive_id'),
        ]);
    }

    public function store(StoreInspectionRequest $request)
    {
        $inspection = Inspection::create([
            ...$request->validated(),
            'beekeeper_id' => auth()->id(),
        ]);

        $inspection->weatherConditions()->sync($request->weather_ids ?? []);
        $inspection->floraTypes()->sync($request->flora_ids ?? []);

        return redirect()->route('inspections.index')->with('success', 'Inspection record added.');
    }

    public function update(UpdateInspectionRequest $request, Inspection $inspection)
    {
        abort_if($inspection->beekeeper_id !== auth()->id(), 403);

        $inspection->update($request->validated());
        $inspection->weatherConditions()->sync($request->weather_ids ?? []);
        $inspection->floraTypes()->sync($request->flora_ids ?? []);

        return redirect()->route('inspections.index')->with('success', 'Inspection record updated.');
    }

    public function destroy(Inspection $inspection)
    {
        abort_if($inspection->beekeeper_id !== auth()->id(), 403);

        $inspection->delete();

        return redirect()->route('inspections.index')->with('success', 'Inspection record deleted.');
    }
}
