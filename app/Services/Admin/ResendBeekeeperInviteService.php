<?php

namespace App\Services\Admin;

use App\Enums\AppErrorCode;
use App\Models\User;
use App\Notifications\BeekeeperInviteNotification;
use App\Support\AppErrorReporter;
use Illuminate\Support\Facades\URL;
use Throwable;

class ResendBeekeeperInviteService
{
    public function execute(User $beekeeper, User $admin): BeekeeperInviteResult
    {
        return $this->deliverInvite(
            $beekeeper,
            $admin,
            successMessage: "Invite resent to {$beekeeper->email}.",
            warningMessage: "The invite for {$beekeeper->email} could not be resent right now. Please try again in a moment.",
            logContext: [
                'action'       => 'resend',
                'beekeeper_id' => $beekeeper->id,
                'email'        => $beekeeper->email,
                'invited_by'   => $admin->id,
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
