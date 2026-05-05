<?php

use Illuminate\Contracts\Console\Kernel;

register_shutdown_function(static function (): void {
    $error = error_get_last();

    if ($error === null) {
        return;
    }

    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];

    if (! in_array($error['type'] ?? 0, $fatalTypes, true)) {
        return;
    }

    if (http_response_code() < 400) {
        http_response_code(500);
    }

    echo sprintf(
        "deploy-hook fatal: %s in %s:%d\n",
        $error['message'] ?? 'unknown error',
        $error['file'] ?? 'unknown file',
        $error['line'] ?? 0,
    );
});

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
    failDeploy(
        "composer install required: composer.lock changed.\n"
        ."Run '/home/urbanale/bin/composer install --no-dev --optimize-autoloader --no-interaction' manually on the server,\n"
        ."then sync .composer-lock-hash with composer.lock before retrying the deploy.",
        409,
    );
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
