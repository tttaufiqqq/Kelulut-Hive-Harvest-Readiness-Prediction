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

        $telegram->sendMessage($user->telegram_id, $this->buildMessage($prediction));
    }

    private function buildMessage(Prediction $prediction): string
    {
        $hiveName = htmlspecialchars((string) $prediction->sensorLog?->hive?->name, ENT_QUOTES, 'UTF-8');
        $readinessLevel = (string) $prediction->readiness_level;
        $confidenceScore = (float) $prediction->confidence_score;
        $hriValue = (float) $prediction->hri_value;
        $score = round($confidenceScore * 100);
        $hriPercent = round($hriValue * 100);
        $time = $prediction->prediction_timestamp->format('d M Y, H:i');

        [$statusLabel, $headline, $suggestedAction] = match ($readinessLevel) {
            'ready' => [
                'Ready to Harvest',
                "<b>{$hiveName}</b> is ready for harvesting.",
                'Suggested action: Inspect the hive and plan harvesting soon.',
            ],
            'nearly_ready' => [
                'Nearly Ready',
                "<b>{$hiveName}</b> is nearly ready for harvesting.",
                'Suggested action: Monitor the hive closely and prepare for harvesting soon.',
            ],
            default => [
                ucwords(str_replace('_', ' ', $readinessLevel)),
                "<b>{$hiveName}</b> has a readiness update.",
                'Suggested action: Review the latest hive status in the dashboard.',
            ],
        };

        return "<b>BuzzyHive Readiness Alert</b>\n\n"
            ."{$headline}\n\n"
            ."<b>Hive</b>: {$hiveName}\n"
            ."<b>Status</b>: {$statusLabel}\n"
            ."<b>HRI</b>: {$hriPercent}%\n"
            ."<b>Confidence</b>: {$score}%\n"
            ."<b>Predicted At</b>: {$time}\n\n"
            .$suggestedAction;
    }
}
