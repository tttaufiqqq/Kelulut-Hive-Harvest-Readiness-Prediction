<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SensorReadingCreated implements ShouldBroadcastNow, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $hiveId,
        public int $sensorLogId,
        public string $recordedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("hive.{$this->hiveId}.sensors")];
    }

    public function broadcastAs(): string
    {
        return 'sensor.reading.created';
    }

    public function broadcastWith(): array
    {
        return [
            'hive_id' => $this->hiveId,
            'sensor_log_id' => $this->sensorLogId,
            'recorded_at' => $this->recordedAt,
        ];
    }
}
