<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBeekeeperRequest;
use App\Http\Requests\Admin\UpdateBeekeeperRequest;
use App\Models\User;
use App\Services\Admin\InviteBeekeeperService;
use App\Services\Admin\ResendBeekeeperInviteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BeekeeperController extends Controller
{
    public function __construct(
        private readonly InviteBeekeeperService $inviteService,
        private readonly ResendBeekeeperInviteService $resendService,
    ) {}

    public function index(): Response
    {
        $beekeepers = User::role('beekeeper')
            ->with('invitedBy:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        $stats = User::role('beekeeper')
            ->selectRaw("COUNT(*) as total, SUM(status = 'pending') as pending, SUM(status = 'active') as active")
            ->first();

        return Inertia::render('admin/beekeepers/index', [
            'beekeepers' => $beekeepers,
            'stats' => [
                'total' => (int) $stats->total,
                'pending' => (int) $stats->pending,
                'active' => (int) $stats->active,
            ],
        ]);
    }

    public function store(StoreBeekeeperRequest $request): RedirectResponse
    {
        $result = $this->inviteService->execute($request->user(), $request->validated());

        return redirect()->route('admin.beekeepers.index')
            ->with($result->flashLevel, $result->message);
    }

    public function update(UpdateBeekeeperRequest $request, User $user): RedirectResponse
    {
        abort_if(! $user->hasRole('beekeeper'), 403);

        $user->update($request->only(['name', 'email', 'phone']));

        return redirect()->route('admin.beekeepers.index')
            ->with('success', 'Beekeeper updated.');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        abort_if(! $user->hasRole('beekeeper'), 403);

        $user->update([
            'status' => $user->isActive() ? 'deactivated' : 'active',
        ]);

        $action = $user->fresh()->isActive() ? 'reactivated' : 'deactivated';

        return redirect()->route('admin.beekeepers.index')
            ->with('success', "Beekeeper {$action}.");
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if(! $user->hasRole('beekeeper'), 403);

        $user->delete();

        return redirect()->route('admin.beekeepers.index')
            ->with('success', 'Beekeeper deleted.');
    }

    public function harvestSummary(User $user): JsonResponse
    {
        abort_if(! $user->hasRole('beekeeper'), 403);

        $rows = DB::select('CALL sp_beekeeper_harvest_summary(?)', [$user->id]);

        return response()->json([
            'hives' => array_map(fn ($row) => [
                'hive_id'       => $row->hive_id,
                'hive_name'     => $row->hive_name,
                'total_weight'  => round((float) $row->total_weight, 1),
                'harvest_count' => (int) $row->harvest_count,
            ], $rows),
        ]);
    }

    public function resendInvite(Request $request, User $user): RedirectResponse
    {
        abort_if(! $user->hasRole('beekeeper'), 403);

        if (! $user->isPending()) {
            return redirect()->route('admin.beekeepers.index')
                ->with('warning', 'Invite can only be resent to pending users.');
        }

        $result = $this->resendService->execute($user, $request->user());

        return redirect()->route('admin.beekeepers.index')
            ->with($result->flashLevel, $result->message);
    }
}
