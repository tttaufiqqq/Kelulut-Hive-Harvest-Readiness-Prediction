<?php

namespace App\Support;

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;

class UserFacingError
{
    public static function fromStatus(int $status): array
    {
        return match ($status) {
            401 => [
                'title' => 'Authorization Required',
                'message' => 'You are not authorized to access this resource.',
                'reason' => 'The request is missing valid credentials or your session is no longer valid.',
                'code' => AppErrorCode::Unauthorized,
            ],
            403 => [
                'title' => 'Access Restricted',
                'message' => 'You do not have permission to access this area.',
                'reason' => 'Your account does not have the role or permission required for this page or action.',
                'code' => AppErrorCode::Forbidden,
            ],
            404 => [
                'title' => 'Page Not Found',
                'message' => 'The requested page could not be found.',
                'reason' => 'The page, record, or file may have been moved, deleted, or the link may be outdated.',
                'code' => AppErrorCode::NotFound,
            ],
            409 => [
                'title' => 'Request Blocked',
                'message' => 'We could not complete that action.',
                'reason' => 'A business rule or record state prevented this request from being completed.',
                'code' => AppErrorCode::BusinessRuleViolation,
            ],
            419 => [
                'title' => 'Session Expired',
                'message' => 'Your session expired before this request could finish.',
                'reason' => 'The security token for the page timed out, usually because the page stayed open too long before submission.',
                'code' => AppErrorCode::SessionExpired,
            ],
            429 => [
                'title' => 'Too Many Requests',
                'message' => 'Too many requests were submitted too quickly.',
                'reason' => 'BuzzyHive temporarily rate-limited this action to protect the service from repeated requests.',
                'code' => AppErrorCode::RateLimited,
            ],
            503 => [
                'title' => 'Service Unavailable',
                'message' => 'A required service is temporarily unavailable.',
                'reason' => 'BuzzyHive could not reach a dependency it needed to finish the request, such as storage, email, or another backend service.',
                'code' => AppErrorCode::ExternalServiceUnavailable,
            ],
            default => [
                'title' => 'Server Error',
                'message' => 'We could not complete your request.',
                'reason' => 'The server hit an unexpected problem while processing the request.',
                'code' => AppErrorCode::UnexpectedError,
            ],
        };
    }

    public static function fromAppException(AppException $exception): array
    {
        return [
            'title' => self::fromStatus($exception->status)['title'],
            'message' => $exception->userMessage,
            'reason' => $exception->context['user_reason'] ?? null,
            'code' => $exception->errorCode,
        ];
    }

    public static function flashPayload(string|array|null $value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return [
                'message' => $value,
                'reason' => null,
            ];
        }

        if (is_array($value) && isset($value['message']) && is_string($value['message'])) {
            return [
                'message' => $value['message'],
                'reason' => isset($value['reason']) && is_string($value['reason'])
                    ? $value['reason']
                    : null,
            ];
        }

        return [
            'message' => 'We could not complete your request.',
            'reason' => 'The app returned an invalid error payload.',
        ];
    }

    public static function sessionPayload(string $message, ?string $reason = null): array
    {
        return [
            'message' => $message,
            'reason' => $reason,
        ];
    }
}
