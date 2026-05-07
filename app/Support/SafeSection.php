<?php

namespace App\Support;

use App\Enums\AppErrorCode;
use Closure;
use Throwable;

class SafeSection
{
    public static function execute(
        string $section,
        Closure $callback,
        mixed $fallback,
        AppErrorCode $errorCode,
    ): mixed {
        try {
            return $callback();
        } catch (Throwable $e) {
            AppErrorReporter::report(
                $e,
                $errorCode,
                context: ['section' => $section],
                level: 'warning',
            );

            return $fallback;
        }
    }
}
