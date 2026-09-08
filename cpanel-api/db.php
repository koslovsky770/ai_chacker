<?php
declare(strict_types=1);

function ac_config(): array
{
    static $config = null;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (!file_exists($path)) {
            ac_fail_startup('Missing config.php. Copy config.example.php to config.php and fill in real values.');
        }
        $config = require $path;
    }
    return $config;
}

function ac_fail_startup(string $message): void
{
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    error_log('[ai-checker-api] startup error: ' . $message);
    echo json_encode(['ok' => false, 'error' => 'Server is not configured correctly']);
    exit;
}

function ac_db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $cfg = ac_config()['db'];
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $cfg['host'],
            $cfg['name'],
            $cfg['charset'] ?? 'utf8mb4'
        );
        try {
            $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log('[ai-checker-api] DB connection failed: ' . $e->getMessage());
            ac_fail_startup('Database connection failed');
        }
    }
    return $pdo;
}
