<?php

namespace App\Http\Controllers;

use App\Http\Requests\Hive\StoreHiveRequest;
use App\Http\Requests\Hive\UpdateHiveRequest;
use App\Models\Hive;

class HiveController extends Controller
{
    public function store(StoreHiveRequest $request)
    {
        Hive::create([
            ...$request->validated(),
            'beekeeper_id' => auth()->id(),
        ]);

        return redirect()->route('dashboard')->with('success', 'Hive created.');
    }

    public function update(UpdateHiveRequest $request, Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $hive->update($request->validated());

        return redirect()->route('dashboard')->with('success', 'Hive updated.');
    }

    public function destroy(Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $hive->delete();

        return redirect()->route('dashboard')->with('success', 'Hive deleted.');
    }

    public function toggleStatus(Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $hive->update(['status' => $hive->status === 'active' ? 'inactive' : 'active']);

        return redirect()->route('dashboard')->with('success', 'Hive status updated.');
    }
}
