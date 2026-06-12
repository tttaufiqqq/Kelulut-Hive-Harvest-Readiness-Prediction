<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreIotNodeRequest;
use App\Http\Requests\Admin\UpdateIotNodeRequest;
use App\Models\Hive;
use App\Models\IotNode;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class IotNodeController extends Controller
{
    public function index(): Response
    {
        $devices = IotNode::with('hive')
            ->withCount('sensorLogs')
            ->orderBy('id')
            ->get()
            ->map(fn ($node) => [
                'id' => $node->id,
                'node_identifier' => $node->node_identifier,
                'hive_id' => $node->hive_id,
                'hive_name' => $node->hive?->name,
                'device_status' => $node->device_status,
                'installation_date' => $node->installation_date
                    ? Carbon::parse($node->installation_date)->toDateString()
                    : null,
                'last_maintenance_date' => $node->last_maintenance_date
                    ? Carbon::parse($node->last_maintenance_date)->toDateString()
                    : null,
                'sensor_log_count' => $node->sensor_logs_count,
            ]);

        $assignedHiveIds = IotNode::pluck('hive_id')->all();

        $allHives = Hive::with(['species', 'site', 'user'])
            ->orderBy('name')
            ->get()
            ->map(fn ($h) => [
                'id'             => $h->id,
                'name'           => $h->name,
                'status'         => $h->status,
                'species_name'   => $h->species?->name,
                'site_name'      => $h->site?->name,
                'beekeeper_name' => $h->user?->name,
            ]);

        $availableHives = $allHives->filter(fn ($h) => ! in_array($h['id'], $assignedHiveIds))->values();

        return Inertia::render('admin/devices/index', [
            'devices' => $devices,
            'all_hives' => $allHives,
            'available_hives' => $availableHives,
        ]);
    }

    public function store(StoreIotNodeRequest $request): RedirectResponse
    {
        do {
            $identifier = 'NODE-' . strtoupper(Str::random(6));
        } while (IotNode::where('node_identifier', $identifier)->exists());

        IotNode::create(array_merge($request->validated(), ['node_identifier' => $identifier]));

        return redirect()->route('admin.devices.index')->with('success', 'Device registered.');
    }

    public function update(UpdateIotNodeRequest $request, IotNode $device): RedirectResponse
    {
        $device->update($request->validated());

        return redirect()->route('admin.devices.index')->with('success', 'Device updated.');
    }

    public function destroy(IotNode $device): RedirectResponse
    {
        if ($device->sensorLogs()->exists()) {
            return redirect()->route('admin.devices.index')
                ->with('warning', "Cannot delete \"{$device->node_identifier}\" — it has sensor log records.");
        }

        $device->delete();

        return redirect()->route('admin.devices.index')->with('success', 'Device removed.');
    }
}
