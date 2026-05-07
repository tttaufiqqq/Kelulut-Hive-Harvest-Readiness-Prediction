<?php

namespace App\Services\Admin;

use App\Models\User;

class BeekeeperInviteResult
{
    public function __construct(
        public readonly User $beekeeper,
        public readonly string $flashLevel,
        public readonly string $message,
    ) {}
}
