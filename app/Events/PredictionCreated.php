<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PredictionCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $hiveId,
        public int $predictionId,
        public string $predictedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("hive.{$this->hiveId}.predictions")];
    }

    public function broadcastAs(): string
    {
        return 'prediction.created';
    }

    public function broadcastWith(): array
    {
        return [
            'hive_id' => $this->hiveId,
            'prediction_id' => $this->predictionId,
            'predicted_at' => $this->predictedAt,
        ];
    }
}
