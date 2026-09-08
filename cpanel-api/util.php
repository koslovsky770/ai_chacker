<?php
declare(strict_types=1);

/** MySQL DATETIME ("Y-m-d H:i:s") -> ISO 8601 string (UTC-naive passthrough). */
function ac_iso(?string $mysqlDatetime): ?string
{
    if ($mysqlDatetime === null) return null;
    $ts = strtotime($mysqlDatetime . ' UTC');
    if ($ts === false) return null;
    return gmdate('Y-m-d\TH:i:s\Z', $ts);
}

function ac_now(): string
{
    return gmdate('Y-m-d H:i:s');
}

/** Decode a JSON column value (or null) into a PHP array, defaulting to []. */
function ac_json_col(?string $value): array
{
    if ($value === null || $value === '') return [];
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function ac_encode_json(array $value): string
{
    return json_encode($value, JSON_UNESCAPED_UNICODE);
}
