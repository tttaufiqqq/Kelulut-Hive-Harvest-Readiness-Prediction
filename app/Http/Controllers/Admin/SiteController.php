<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSiteRequest;
use App\Http\Requests\Admin\UpdateSiteRequest;
use App\Models\MasterSite;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller
{
    public function index(): Response
    {
        $sites = MasterSite::withCount('hives')
            ->orderBy('name')
            ->get()
            ->map(fn($site) => [
                'id'          => $site->id,
                'name'        => $site->name,
                'description' => $site->description,
                'hive_count'  => $site->hives_count,
            ]);

        return Inertia::render('admin/sites/index', [
            'sites' => $sites,
        ]);
    }

    public function store(StoreSiteRequest $request): RedirectResponse
    {
        MasterSite::create($request->validated());

        return redirect()->route('admin.sites.index')->with('success', 'Site added.');
    }

    public function update(UpdateSiteRequest $request, MasterSite $site): RedirectResponse
    {
        $site->update($request->validated());

        return redirect()->route('admin.sites.index')->with('success', 'Site updated.');
    }

    public function destroy(MasterSite $site): RedirectResponse
    {
        if ($site->hives()->exists()) {
            return redirect()->route('admin.sites.index')
                ->with('error', "Cannot delete \"{$site->name}\" — {$site->hives()->count()} hive(s) are assigned to it.");
        }

        $site->delete();

        return redirect()->route('admin.sites.index')->with('success', 'Site deleted.');
    }
}
