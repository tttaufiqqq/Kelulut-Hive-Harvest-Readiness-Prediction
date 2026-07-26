<?php

namespace App\Services;

use App\Models\Hive;
use App\Models\SensorLog;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class BuildHourlySensorReadingsService
{
    public function execute(Hive $hive, CarbonInterface $date): array
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $hourExpr = $isSqlite
            ? "strftime('%H:00', record_timestamp)"
            : 'DATE_FORMAT(record_timestamp, "%H:00")';

        return SensorLog::where('hive_id', $hive->id)
            ->whereDate('record_timestamp', $date)
            ->selectRaw("
                {$hourExpr} as time,
                AVG(temp)         as temp,
                AVG(humidity)     as humidity,
                AVG(mq2_value)    as mq2,
                AVG(mq3_value)    as mq3,
                AVG(mq5_value)    as mq5,
                AVG(mq135_value)  as mq135
            ")
            ->groupByRaw($hourExpr)
            ->orderBy('time')
            ->get()
            ->map(fn ($row) => [
                'time'     => $row->time,
                'temp'     => round($row->temp, 1),
                'humidity' => round($row->humidity, 1),
                'mq2'      => round($row->mq2),
                'mq3'      => round($row->mq3),
                'mq5'      => round($row->mq5),
                'mq135'    => round($row->mq135),
            ])
            ->all();
    }
}
