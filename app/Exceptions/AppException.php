<?php

namespace App\Exceptions;

use App\Enums\AppErrorCode;
use RuntimeException;
use Throwable;

class AppException extends RuntimeException
{
    public function __construct(
        public readonly AppErrorCode $errorCode,
        public readonly int $status,
        public readonly string $userMessage,
        public readonly string $logLevel = 'error',
        public readonly array $context = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($userMessage, $status, $previous);
    }

    public function context(): array
    {
        return $this->context;
    }
}
