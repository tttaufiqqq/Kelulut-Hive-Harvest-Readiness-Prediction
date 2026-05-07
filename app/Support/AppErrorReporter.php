<?php

namespace App\Support;

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use Illuminate\Support\Facades\Log;
use Throwable;

class AppErrorReporter
{
    public static function report(
        Throwable $exception,
        AppErrorCode $errorCode,
        array $context = [],
        string $level = 'error',
    ): void {
        Log::log($level, 'Application error recorded.', [
            ...$context,
            'error_code' => $errorCode->value,
            'exception_class' => $exception::class,
            'exception_message' => $exception->getMessage(),
        ]);
    }

    public static function reportAppException(AppException $exception): void
    {
        self::report(
            $exception,
            $exception->errorCode,
            $exception->context(),
            $exception->logLevel,
        );
    }
}
