<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/** @var \Closure(User, int): bool $canAccessHiveChannel */
$canAccessHiveChannel = static function (User $user, int $hiveId): bool {
    if ($user->hasRole('admin')) {
        return true;
    }

    if (! $user->hasRole('beekeeper')) {
        return false;
    }

    return $user->hives()->whereKey($hiveId)->exists();
};

Broadcast::channel('hive.{hiveId}.sensors', function (User $user, int $hiveId) {
    return $canAccessHiveChannel($user, $hiveId);
});

Broadcast::channel('hive.{hiveId}.predictions', function (User $user, int $hiveId) {
    return $canAccessHiveChannel($user, $hiveId);
});
