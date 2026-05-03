<?php

namespace App\Console\Commands;

use App\Models\SensorLog;
use App\Services\MlPredictionService;
use Illuminate\Console\Command;

class BackfillPredictions extends Command
{
    protected $signature   = 'ml:backfill {--limit=50 : Max logs to process}';
    protected $description = 'Run ML predictions for sensor logs that have no prediction yet';

    public function handle(MlPredictionService $mlService): void
    {
        $logs = SensorLog::doesntHave('prediction')
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get();

        if ($logs->isEmpty()) {
            $this->info('No unpredicted sensor logs found.');
            return;
        }

        $this->info("Processing {$logs->count()} sensor log(s)...");
        $bar = $this->output->createProgressBar($logs->count());

        $ok = 0;
        $fail = 0;

        foreach ($logs as $log) {
            $result = $mlService->predict($log);
            $result ? $ok++ : $fail++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done — {$ok} predicted, {$fail} failed.");
    }
}
