<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBeekeeperRequest;
use App\Http\Requests\Admin\UpdateBeekeeperRequest;
use App\Models\User;
use App\Notifications\BeekeeperInviteNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class BeekeeperController extends Controller
{
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
        $beekeeper = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => null,
            'status' => 'pending',
            'invited_by' => $request->user()->id,
        ]);

        $beekeeper->assignRole(Role::findByName('beekeeper'));

        $inviteUrl = URL::temporarySignedRoute(
            'invite.accept',
            now()->addDays(7),
            ['user' => $beekeeper->id]
        );

        $beekeeper->notify(new BeekeeperInviteNotification($inviteUrl, $request->user()->name));

        return redirect()->route('admin.beekeepers.index')
            ->with('success', "Invite sent to {$beekeeper->email}.");
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

    public function resendInvite(Request $request, User $user): RedirectResponse
    {
        abort_if(! $user->hasRole('beekeeper'), 403);

        if (! $user->isPending()) {
            return redirect()->route('admin.beekeepers.index')
                ->with('error', 'Invite can only be resent to pending users.');
        }

        $inviteUrl = URL::temporarySignedRoute(
            'invite.accept',
            now()->addDays(7),
            ['user' => $user->id]
        );

        $user->notify(new BeekeeperInviteNotification($inviteUrl, $request->user()->name));

        return redirect()->route('admin.beekeepers.index')
            ->with('success', "Invite resent to {$user->email}.");
    }
}
