<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * One-off gap-fill (Session 6, page 5): continues each hive's sensor_logs
 * from its last real reading through RANGE_END, at the same Mon/Wed/Fri
 * cadence as the bulk historical data and SensorReadingsBackfillSeeder.
 * Needed because InspectionGapFillSeeder was extended to 2028-08-31 to
 * match the harvest table's post-8a-calibration date range, and sensor
 * data needs to cover the same window for "pre-harvest HRI" to have
 * anything to link to. Unlike SensorReadingsBackfillSeeder (fixed past
 * RANGE_START, ends at real wall-clock "now"), this dynamically finds
 * each hive's current last reading and runs to a fixed future RANGE_END.
 */
class SensorReadingsFutureExtensionSeeder extends Seeder
{
    private const RANGE_END = '2028-08-31 23:59:59';

    public function run(): void
    {
        $rangeEnd = Carbon::parse(self::RANGE_END);

        $hives = DB::table('hives')->orderBy('id')->get();
        $nodes = DB::table('iot_nodes')->get()->keyBy('hive_id');

        foreach ($hives as $hive) {
            $node = $nodes[$hive->id] ?? null;
            if (! $node) {
                $this->command->warn("{$hive->name}: no IoT node, skipping.");

                continue;
            }

            $lastTimestamp = DB::table('sensor_logs')
                ->where('hive_id', $hive->id)
                ->max('record_timestamp');

            if ($lastTimestamp === null) {
                $this->command->warn("{$hive->name}: no existing sensor_logs, skipping.");

                continue;
            }

            $cursor = Carbon::parse($lastTimestamp)->addDay()->startOfDay();

            if ($cursor->gt($rangeEnd)) {
                $this->command->warn("{$hive->name}: already past range end, skipping.");

                continue;
            }

            $profile = $this->resolveBaseline($hive->id);
            $hri = $this->resolveStartingHri($hive->id);

            $timestamps = $this->buildTimestamps($cursor, $rangeEnd);

            $predRows = [];

            foreach ($timestamps as $ts) {
                $hour = (int) $ts->format('H');
                $tempOff = round(sin(($hour - 6) * M_PI / 12) * 1.5 + (rand(-8, 8) / 10), 1);
                $humOff = round(-sin(($hour - 6) * M_PI / 12) * 3.0 + (rand(-8, 8) / 10), 1);
                $mqVar = rand(-40, 60);

                $logId = DB::table('sensor_logs')->insertGetId([
                    'hive_id' => $hive->id,
                    'device_id' => $node->id,
                    'temp' => round($profile['tempBase'] + $tempOff, 1),
                    'humidity' => round($profile['humBase'] + $humOff, 1),
                    'mq2_value' => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'mq3_value' => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'mq5_value' => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'mq135_value' => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'record_timestamp' => $ts->toDateTimeString(),
                    'created_at' => $ts->toDateTimeString(),
                ]);

                $hri = $this->stepRandomWalk($hri);
                $level = $this->levelForHri($hri);

                $predRows[] = [
                    'sensor_log_id' => $logId,
                    'readiness_level' => $level,
                    'raw_readiness_level' => $level,
                    'hri_value' => $hri,
                    'raw_hri_value' => $hri,
                    'confidence_score' => round(0.62 + rand(0, 33) / 100, 2),
                    'model_version' => 'v1.0-seeded',
                    'warning_state' => 'none',
                    'guardrail_action' => 'none',
                    'threshold_warning_level' => 'none',
                    'out_of_distribution' => false,
                    'out_of_distribution_features' => null,
                    'prediction_warning' => null,
                    'prediction_timestamp' => $ts->toDateTimeString(),
                ];
            }

            foreach (array_chunk($predRows, 500) as $chunk) {
                DB::table('predictions')->insert($chunk);
            }

            $this->command->info("{$hive->name}: ".count($predRows)." logs + predictions seeded ({$lastTimestamp} to ".self::RANGE_END.').');
        }
    }

    /**
     * @return Carbon[]
     */
    private function buildTimestamps(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $timestamps = [];
        $cursor = $rangeStart->copy();

        while ($cursor->lte($rangeEnd)) {
            if (in_array($cursor->dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::FRIDAY], true)) {
                $ts = $cursor->copy()->setTime(rand(8, 18), rand(0, 59), 0);
                if ($ts->between($rangeStart, $rangeEnd)) {
                    $timestamps[] = $ts;
                }
            }
            $cursor->addDay();
        }

        return $timestamps;
    }

    private function resolveStartingHri(int $hiveId): float
    {
        $lastHri = DB::table('predictions')
            ->join('sensor_logs', 'sensor_logs.id', '=', 'predictions.sensor_log_id')
            ->where('sensor_logs.hive_id', $hiveId)
            ->orderByDesc('sensor_logs.record_timestamp')
            ->value('predictions.hri_value');

        return $lastHri !== null ? (float) $lastHri : round(0.55 + rand(0, 30) / 100, 2);
    }

    private function stepRandomWalk(float $current): float
    {
        $step = (rand(0, 100) <= 8)
            ? (rand(-1, 1) * (rand(8, 15) / 100))
            : (rand(-1, 1) * (rand(1, 4) / 100));

        return round(min(0.97, max(0.12, $current + $step)), 2);
    }

    private function levelForHri(float $hri): string
    {
        return match (true) {
            $hri <= 0.24 => 'not_ready',
            $hri <= 0.49 => 'approaching',
            $hri <= 0.74 => 'nearly_ready',
            default => 'ready',
        };
    }

    /**
     * @return array{tempBase: float, humBase: float, mqBase: int}
     */
    private function resolveBaseline(int $hiveId): array
    {
        $recent = DB::table('sensor_logs')
            ->where('hive_id', $hiveId)
            ->orderByDesc('record_timestamp')
            ->limit(20)
            ->get(['temp', 'humidity', 'mq2_value']);

        if ($recent->isEmpty()) {
            return ['tempBase' => 34.0, 'humBase' => 72.0, 'mqBase' => 210];
        }

        return [
            'tempBase' => round((float) $recent->avg('temp'), 1),
            'humBase' => round((float) $recent->avg('humidity'), 1),
            'mqBase' => (int) round($recent->avg('mq2_value')),
        ];
    }
}
