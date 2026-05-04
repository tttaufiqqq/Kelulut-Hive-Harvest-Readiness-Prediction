<?php

namespace App\Jobs;

use App\Models\Prediction;
use App\Services\TelegramService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendTelegramAlert implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $predictionId) {}

    public function handle(TelegramService $telegram): void
    {
        $prediction = Prediction::with('sensorLog.hive.user')->find($this->predictionId);

        if (! $prediction) {
            return;
        }

        $user = $prediction->sensorLog?->hive?->user;

        if (! $user?->telegram_id) {
            return;
        }

        $hive = $prediction->sensorLog->hive;
        $score = round($prediction->confidence_score * 100);
        $time = $prediction->prediction_timestamp->format('d M Y, H:i');

        $message = "<b>BuzzyHive Alert</b>\n\n"
            ."Hive: <b>{$hive->name}</b>\n"
            ."Status: <b>Ready to Harvest</b>\n"
            ."Confidence: {$score}%\n"
            ."Time: {$time}\n\n"
            .'Your kelulut hive is ready for harvesting!';

        $telegram->sendMessage($user->telegram_id, $message);
    }
}
