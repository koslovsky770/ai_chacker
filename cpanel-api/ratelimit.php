<?php
declare(strict_types=1);

/**
 * Very small file-based per-IP rate limiter. Good enough to blunt casual
 * abuse of this internal API; it is not meant to replace a real WAF.
 */
function ac_enforce_rate_limit(): void
{
    $cfg = ac_config()['rate_limit'] ?? ['max_requests' => 60, 'window_seconds' => 60];
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ip = trim(explode(',', $ip)[0]);

    $dir = sys_get_temp_dir() . '/ai_checker_ratelimit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $file = $dir . '/' . preg_replace('/[^a-zA-Z0-9_.:-]/', '_', $ip) . '.json';

    $now = time();
    $window = (int)$cfg['window_seconds'];
    $max = (int)$cfg['max_requests'];

    $handle = @fopen($file, 'c+');
    if (!$handle) {
        return; // fail open - don't block traffic if tmp dir isn't writable
    }

    flock($handle, LOCK_EX);
    $raw = stream_get_contents($handle);
    $state = $raw ? json_decode($raw, true) : null;

    if (!is_array($state) || !isset($state['windowStart']) || $now - $state['windowStart'] >= $window) {
        $state = ['windowStart' => $now, 'count' => 0];
    }
    $state['count']++;

    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($state));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    if ($state['count'] > $max) {
        ac_json_error('Too many requests, please slow down', 429);
    }
}
