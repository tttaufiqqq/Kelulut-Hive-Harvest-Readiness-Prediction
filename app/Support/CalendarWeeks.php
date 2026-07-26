<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class CalendarWeeks
{
    public const DAYS_PER_CHUNK = 7;

    public static function forMonth(CarbonInterface $month): array
    {
        $monthStart = CarbonImmutable::parse($month)->startOfMonth();
        $monthEnd = $monthStart->endOfMonth();
        $weeks = [];
        $week = 1;

        for ($start = $monthStart; $start->lte($monthEnd); $start = $start->addDays(self::DAYS_PER_CHUNK)) {
            $end = $start->addDays(self::DAYS_PER_CHUNK - 1)->min($monthEnd);

            $weeks[] = [
                'week' => $week,
                'start' => $start->startOfDay(),
                'end' => $end->endOfDay(),
                'label' => sprintf('Week %d: %s - %s', $week, $start->format('M j'), $end->format('M j')),
            ];

            $week++;
        }

        return $weeks;
    }

    public static function range(CarbonInterface $month, int $week): array
    {
        $weeks = self::forMonth($month);
        $clampedWeek = max(1, min($week, count($weeks)));
        $chosen = $weeks[$clampedWeek - 1];

        return [
            'start' => $chosen['start'],
            'end' => $chosen['end'],
            'week' => $chosen['week'],
        ];
    }

    public static function weekNumberFor(CarbonInterface $date): int
    {
        return (int) ceil($date->day / self::DAYS_PER_CHUNK);
    }
}
