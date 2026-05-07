<?php

namespace App\Services\Admin;

use App\Enums\AppErrorCode;
use App\Models\User;
use App\Notifications\BeekeeperInviteNotification;
use App\Support\AppErrorReporter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Role;
use Throwable;

class BeekeeperInviteService
{
    public function invite(User $admin, array $attributes): BeekeeperInviteResult
    {
        $beekeeper = DB::transaction(function () use ($admin, $attributes) {
            $beekeeper = User::create([
                'name' => $attributes['name'],
                'email' => $attributes['email'],
                'phone' => $attributes['phone'] ?? null,
                'password' => null,
                'status' => 'pending',
                'invited_by' => $admin->id,
            ]);

            $beekeeper->assignRole(Role::findByName('beekeeper'));

            return $beekeeper;
        });

        return $this->deliverInvite(
            $beekeeper,
            $admin,
            successMessage: "Invite sent to {$beekeeper->email}.",
            warningMessage: "Beekeeper {$beekeeper->email} was created, but the invite email could not be delivered. Please resend the invite.",
            logContext: [
                'action' => 'store',
                'beekeeper_id' => $beekeeper->id,
                'email' => $beekeeper->email,
                'invited_by' => $admin->id,
            ],
        );
    }

    public function resend(User $beekeeper, User $admin): BeekeeperInviteResult
    {
        return $this->deliverInvite(
            $beekeeper,
            $admin,
            successMessage: "Invite resent to {$beekeeper->email}.",
            warningMessage: "The invite for {$beekeeper->email} could not be resent right now. Please try again in a moment.",
            logContext: [
                'action' => 'resend',
                'beekeeper_id' => $beekeeper->id,
                'email' => $beekeeper->email,
                'invited_by' => $admin->id,
            ],
        );
    }

    private function deliverInvite(
        User $beekeeper,
        User $admin,
        string $successMessage,
        string $warningMessage,
        array $logContext,
    ): BeekeeperInviteResult {
        try {
            $inviteUrl = URL::temporarySignedRoute(
                'invite.accept',
                now()->addDays(7),
                ['user' => $beekeeper->id],
            );

            $beekeeper->notify(
                new BeekeeperInviteNotification($inviteUrl, $admin->name),
            );

            return new BeekeeperInviteResult($beekeeper, 'success', $successMessage);
        } catch (Throwable $e) {
            AppErrorReporter::report(
                $e,
                AppErrorCode::InviteDeliveryFailed,
                context: $logContext,
                level: 'warning',
            );

            return new BeekeeperInviteResult($beekeeper, 'warning', $warningMessage);
        }
    }
}
