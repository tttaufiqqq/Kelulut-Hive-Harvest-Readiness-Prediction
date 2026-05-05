<?php

use Illuminate\Contracts\Console\Kernel;

function readEnvValue(string $envPath, string $key): string
{
    if (! file_exists($envPath)) {
        return '';
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return '';
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        if (str_starts_with($trimmed, 'export ')) {
            $trimmed = trim(substr($trimmed, 7));
        }

        [$name, $value] = array_pad(explode('=', $trimmed, 2), 2, null);

        if (trim((string) $name) !== $key || $value === null) {
            continue;
        }

        return trim($value, " \t\n\r\0\x0B\"'");
    }

    return '';
}

$envPath = dirname(__DIR__).'/.env';
$expectedSecret = readEnvValue($envPath, 'DEPLOY_SECRET');

// Reject if secret missing or doesn't match
$providedSecret = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';
if (empty($expectedSecret) || ! hash_equals($expectedSecret, $providedSecret)) {
    http_response_code(403);
    exit('Forbidden');
}

function failDeploy(string $message, int $httpStatus = 500): never
{
    http_response_code($httpStatus);
    exit($message."\n");
}

// Install composer dependencies only when composer.lock has changed
$laravelRoot = dirname(__DIR__);
$lockHash = md5_file($laravelRoot.'/composer.lock');
$hashFile = $laravelRoot.'/.composer-lock-hash';
$previousHash = file_exists($hashFile) ? trim(file_get_contents($hashFile)) : '';

if ($lockHash !== $previousHash) {
    $composerOutput = [];
    $composerExitCode = 0;
    $composerCommand = sprintf(
        'cd %s && /home/urbanale/bin/composer install --no-dev --optimize-autoloader --no-interaction 2>&1',
        escapeshellarg($laravelRoot),
    );

    exec($composerCommand, $composerOutput, $composerExitCode);

    echo implode("\n", $composerOutput)."\n";

    if ($composerExitCode !== 0) {
        failDeploy("composer install: FAILED (exit $composerExitCode)");
    }

    file_put_contents($hashFile, $lockHash);
    echo "composer install: OK\n";
} else {
    echo "composer install: skipped (no changes)\n";
}

// Bootstrap Laravel and run artisan commands
require dirname(__DIR__).'/vendor/autoload.php';
$app = require dirname(__DIR__).'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);

$commands = [
    ['optimize:clear', []],
    ['migrate', ['--force' => true]],
    ['db:seed', ['--class' => 'MasterDataSeeder', '--force' => true]],
    ['config:cache', []],
    ['route:cache', []],
    ['view:cache', []],
];

foreach ($commands as [$command, $args]) {
    $status = $kernel->call($command, $args);
    echo "$command: ".($status === 0 ? 'OK' : "FAILED (exit $status)")."\n";

    if ($status !== 0) {
        failDeploy("$command: FAILED (exit $status)");
    }
}
