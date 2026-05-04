<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hive\StoreHiveRequest;
use App\Http\Requests\Hive\UpdateHiveRequest;
use App\Models\Hive;
use App\Models\MasterSite;
use App\Models\MasterSpecies;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HiveController extends Controller
{
    public function index(): Response
    {
        $hives = Hive::with(['user', 'species', 'site'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($hive) => [
                'id' => $hive->id,
                'name' => $hive->name,
                'beekeeper_id' => $hive->beekeeper_id,
                'beekeeper_name' => $hive->user?->name,
                'species' => $hive->species?->name,
                'species_id' => $hive->species_id,
                'site' => $hive->site?->name,
                'site_id' => $hive->site_id,
                'status' => $hive->status,
                'age_months' => (int) $hive->created_at->diffInMonths(now()),
                'image_path' => $hive->image_path,
            ]);

        return Inertia::render('admin/hives/index', [
            'hives' => $hives->values(),
            'beekeepers' => User::role('beekeeper')->orderBy('name')->get(['id', 'name']),
            'species_list' => MasterSpecies::orderBy('name')->get(['id', 'name']),
            'sites_list' => MasterSite::orderBy('name')->get(['id', 'name']),
            'stats' => [
                'total' => $hives->count(),
                'active' => $hives->where('status', 'active')->count(),
                'inactive' => $hives->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function store(StoreHiveRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('hives', 'public');
        }

        $data['status'] ??= 'active';

        Hive::create($data);

        return redirect()->route('admin.hives.index')->with('success', 'Hive registered.');
    }

    public function update(UpdateHiveRequest $request, Hive $hive): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($hive->image_path) {
                Storage::disk('public')->delete($hive->image_path);
            }
            $data['image_path'] = $request->file('image')->store('hives', 'public');
        }

        $hive->update($data);

        return redirect()->route('admin.hives.index')->with('success', 'Hive updated.');
    }

    public function destroy(Hive $hive): RedirectResponse
    {
        if ($hive->image_path) {
            Storage::disk('public')->delete($hive->image_path);
        }

        $hive->delete();

        return redirect()->route('admin.hives.index')->with('success', 'Hive deleted.');
    }

    public function toggleStatus(Hive $hive): RedirectResponse
    {
        $hive->update(['status' => $hive->status === 'active' ? 'inactive' : 'active']);

        return redirect()->route('admin.hives.index')->with('success', 'Hive status updated.');
    }
}
