<?php

namespace App\Services;

use App\Models\Hive;
use App\Models\SensorLog;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class BuildWeeklySensorReadingsService
{
    public function execute(Hive $hive, CarbonInterface $start, CarbonInterface $end): array
    {
        return SensorLog::where('hive_id', $hive->id)
            ->whereBetween('record_timestamp', [$start, $end])
            ->selectRaw('
                DATE(record_timestamp) as day,
                AVG(temp)         as temp,
                AVG(humidity)     as humidity,
                AVG(mq2_value)    as mq2,
                AVG(mq3_value)    as mq3,
                AVG(mq5_value)    as mq5,
                AVG(mq135_value)  as mq135
            ')
            ->groupByRaw('DATE(record_timestamp)')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'time' => Carbon::parse($row->day)->format('D, M j'),
                'temp' => round($row->temp, 1),
                'humidity' => round($row->humidity, 1),
                'mq2' => round($row->mq2),
                'mq3' => round($row->mq3),
                'mq5' => round($row->mq5),
                'mq135' => round($row->mq135),
            ])
            ->all();
    }
}
