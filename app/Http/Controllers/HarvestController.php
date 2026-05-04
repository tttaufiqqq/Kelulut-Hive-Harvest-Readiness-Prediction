<?php

namespace App\Http\Controllers;

use App\Http\Requests\Harvest\StoreHarvestRequest;
use App\Http\Requests\Harvest\UpdateHarvestRequest;
use App\Models\Harvest;
use App\Models\Hive;
use App\Models\MasterHoneyColor;
use App\Models\MasterHoneyFlavor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HarvestController extends Controller
{
    public function index(Request $request)
    {
        $harvests = Harvest::where('beekeeper_id', auth()->id())
            ->when($request->hive_id, fn ($q) => $q->where('hive_id', $request->hive_id))
            ->with(['hive', 'color', 'flavor'])
            ->latest('harvest_date')
            ->paginate(15);

        $hives = Hive::where('beekeeper_id', auth()->id())
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('harvests/index', [
            'harvests' => $harvests,
            'hives' => $hives,
            'colors' => MasterHoneyColor::orderBy('name')->get(['id', 'name']),
            'flavors' => MasterHoneyFlavor::orderBy('name')->get(['id', 'name']),
            'filters' => ['hive_id' => $request->hive_id],
        ]);
    }

    public function store(StoreHarvestRequest $request)
    {
        Harvest::create([
            ...$request->validated(),
            'beekeeper_id' => auth()->id(),
        ]);

        return redirect()->route('harvests.index')->with('success', 'Harvest record added.');
    }

    public function update(UpdateHarvestRequest $request, Harvest $harvest)
    {
        abort_if($harvest->beekeeper_id !== auth()->id(), 403);

        $harvest->update($request->validated());

        return redirect()->route('harvests.index')->with('success', 'Harvest record updated.');
    }

    public function destroy(Harvest $harvest)
    {
        abort_if($harvest->beekeeper_id !== auth()->id(), 403);

        $harvest->delete();

        return redirect()->route('harvests.index')->with('success', 'Harvest record deleted.');
    }
}
