#!/usr/bin/env php
<?php

declare(strict_types=1);

use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Contracts\Console\Kernel;

$basePath = dirname(__DIR__);

require $basePath.'/vendor/autoload.php';

$app = require $basePath.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$failures = 0;
$warnings = 0;

function line(string $message = ''): void
{
    echo $message.PHP_EOL;
}

function section(string $title): void
{
    line();
    line("=== $title ===");
}

function maskValue(mixed $value, bool $reveal = false): string
{
    $stringValue = trim((string) $value);

    if ($stringValue === '') {
        return '(empty)';
    }

    if ($reveal) {
        return $stringValue;
    }

    if (strlen($stringValue) <= 8) {
        return str_repeat('*', strlen($stringValue));
    }

    return substr($stringValue, 0, 4).str_repeat('*', max(strlen($stringValue) - 8, 1)).substr($stringValue, -4);
}

function pass(string $message): void
{
    line("PASS $message");
}

function warn(string $message): void
{
    global $warnings;

    $warnings++;
    line("WARN $message");
}

function fail(string $message): void
{
    global $failures;

    $failures++;
    line("FAIL $message");
}

section('Laravel broadcast config');

$defaultBroadcaster = (string) config('broadcasting.default', '');

if ($defaultBroadcaster === 'pusher') {
    pass("broadcasting.default = $defaultBroadcaster");
} else {
    fail("broadcasting.default = $defaultBroadcaster (expected pusher)");
}

$pusherConfig = config('broadcasting.connections.pusher', []);
$pusherOptions = $pusherConfig['options'] ?? [];

$configChecks = [
    'PUSHER_APP_ID' => $pusherConfig['app_id'] ?? null,
    'PUSHER_APP_KEY' => $pusherConfig['key'] ?? null,
    'PUSHER_APP_SECRET' => $pusherConfig['secret'] ?? null,
    'PUSHER_APP_CLUSTER' => $pusherOptions['cluster'] ?? null,
    'PUSHER_SCHEME' => $pusherOptions['scheme'] ?? null,
    'PUSHER_PORT' => $pusherOptions['port'] ?? null,
];

foreach ($configChecks as $name => $value) {
    if (trim((string) $value) === '') {
        fail("$name is empty in active Laravel config");
        continue;
    }

    $reveal = in_array($name, ['PUSHER_APP_CLUSTER', 'PUSHER_SCHEME', 'PUSHER_PORT'], true);
    pass("$name = ".maskValue($value, $reveal));
}

try {
    app(BroadcastManager::class)->connection('pusher');
    pass('Laravel can instantiate the pusher broadcaster');
} catch (Throwable $e) {
    fail('Laravel cannot instantiate the pusher broadcaster: '.$e->getMessage());
}

section('Built frontend bundle');

$manifestPath = $basePath.'/public/build/manifest.json';

if (! file_exists($manifestPath)) {
    fail("manifest file not found at $manifestPath");
} else {
    pass('manifest file exists');

    $manifest = json_decode((string) file_get_contents($manifestPath), true);

    if (! is_array($manifest)) {
        fail('manifest.json is not valid JSON');
    } else {
        $appEntry = $manifest['resources/js/app.tsx']['file'] ?? null;

        if (! is_string($appEntry) || trim($appEntry) === '') {
            fail('resources/js/app.tsx entry not found in manifest.json');
        } else {
            $bundlePath = $basePath.'/public/build/'.$appEntry;

            if (! file_exists($bundlePath)) {
                fail("app bundle not found at $bundlePath");
            } else {
                pass("app bundle exists: public/build/$appEntry");

                $bundle = (string) file_get_contents($bundlePath);
                $activeKey = (string) ($pusherConfig['key'] ?? '');
                $activeCluster = (string) ($pusherOptions['cluster'] ?? '');

                if ($activeKey !== '') {
                    if (str_contains($bundle, $activeKey)) {
                        pass('frontend bundle contains the configured PUSHER_APP_KEY');
                    } else {
                        fail('frontend bundle does not contain the configured PUSHER_APP_KEY; VITE_PUSHER_APP_KEY may have been missing during build');
                    }
                }

                if ($activeCluster !== '') {
                    if (str_contains($bundle, $activeCluster)) {
                        pass('frontend bundle contains the configured PUSHER_APP_CLUSTER');
                    } else {
                        fail('frontend bundle does not contain the configured PUSHER_APP_CLUSTER; VITE_PUSHER_APP_CLUSTER may have been missing during build');
                    }
                }

                if (! str_contains($bundle, 'broadcaster')) {
                    warn('frontend bundle does not visibly contain the word "broadcaster"; minification may make deeper inspection harder');
                }
            }
        }
    }
}

section('Summary');

if ($failures === 0) {
    pass("broadcast diagnostics passed with $warnings warning(s)");
    exit(0);
}

fail("broadcast diagnostics failed with $failures failure(s) and $warnings warning(s)");
exit(1);
