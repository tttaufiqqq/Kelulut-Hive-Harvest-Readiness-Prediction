<?php

namespace App\Enums;

enum AppErrorCode: string
{
    case Unauthorized = 'unauthorized';
    case Forbidden = 'forbidden';
    case NotFound = 'not_found';
    case ValidationFailed = 'validation_failed';
    case SessionExpired = 'session_expired';
    case RateLimited = 'rate_limited';
    case ExternalServiceUnavailable = 'external_service_unavailable';
    case MlUnavailable = 'ml_unavailable';
    case FileStorageFailed = 'file_storage_failed';
    case PredictionNotReady = 'prediction_not_ready';
    case PredictionPersistFailed = 'prediction_persist_failed';
    case InviteDeliveryFailed = 'invite_delivery_failed';
    case TelegramDeliveryFailed = 'telegram_delivery_failed';
    case UnexpectedError = 'unexpected_error';
    case BusinessRuleViolation = 'business_rule_violation';
}
