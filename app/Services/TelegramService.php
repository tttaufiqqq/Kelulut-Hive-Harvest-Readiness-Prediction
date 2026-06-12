<?php

namespace App\Services;

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use Illuminate\Support\Facades\Http;
use Throwable;

class TelegramService
{
    public function execute(string $chatId, string $text): void
    {
        $token = config('services.telegram.token');

        if (! is_string($token) || $token === '') {
            throw new AppException(
                AppErrorCode::TelegramDeliveryFailed,
                503,
                'Unable to deliver the Telegram alert right now.',
                'warning',
                ['chat_id' => $chatId, 'reason' => 'missing_token'],
            );
        }

        try {
            $response = Http::timeout(5)->post(
                "https://api.telegram.org/bot{$token}/sendMessage",
                ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML'],
            );

            if (! $response->successful()) {
                throw new AppException(
                    AppErrorCode::TelegramDeliveryFailed,
                    503,
                    'Unable to deliver the Telegram alert right now.',
                    'warning',
                    [
                        'chat_id' => $chatId,
                        'status' => $response->status(),
                    ],
                );
            }
        } catch (AppException $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new AppException(
                AppErrorCode::TelegramDeliveryFailed,
                503,
                'Unable to deliver the Telegram alert right now.',
                'warning',
                ['chat_id' => $chatId],
                $e,
            );
        }
    }
}
