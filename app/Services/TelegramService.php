<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public function sendMessage(string $chatId, string $text): void
    {
        $token = config('services.telegram.token');

        $response = Http::timeout(5)->post(
            "https://api.telegram.org/bot{$token}/sendMessage",
            ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML']
        );

        if (! $response->successful()) {
            Log::warning('Telegram alert failed', [
                'chat_id' => $chatId,
                'status' => $response->status(),
            ]);
        }
    }
}
