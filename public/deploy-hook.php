<?php

// Load .env manually to get DEPLOY_SECRET
$envPath = dirname(__DIR__) . '/.env';
$env = file_exists($envPath) ? parse_ini_file($envPath) : [];
$expectedSecret = $env['DEPLOY_SECRET'] ?? '';

// Reject if secret missing or doesn't match
$providedSecret = $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';
if (empty($expectedSecret) || !hash_equals($expectedSecret, $providedSecret)) {
    http_response_code(403);
    exit('Forbidden');
}

// Install composer dependencies
$laravelRoot = dirname(__DIR__);
shell_exec("cd $laravelRoot && /home/urbanale/bin/composer install --no-dev --optimize-autoloader --no-interaction 2>&1");

// Bootstrap Laravel and run artisan commands
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$commands = [
    ['migrate', ['--force' => true]],
    ['config:cache', []],
    ['route:cache', []],
    ['view:cache', []],
];

foreach ($commands as [$command, $args]) {
    $status = $kernel->call($command, $args);
    echo "$command: " . ($status === 0 ? 'OK' : "FAILED (exit $status)") . "\n";
}
