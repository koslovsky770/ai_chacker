<?php
declare(strict_types=1);

function ac_require_string(array $body, string $key, int $maxLen = 1000): string
{
    if (!isset($body[$key]) || !is_string($body[$key]) || trim($body[$key]) === '') {
        throw new ApiException("Missing or invalid field: $key");
    }
    $val = trim($body[$key]);
    if (mb_strlen($val) > $maxLen) {
        throw new ApiException("Field too long: $key");
    }
    return $val;
}

function ac_optional_string(array $body, string $key, int $maxLen = 1000): ?string
{
    if (!isset($body[$key]) || $body[$key] === null) return null;
    if (!is_string($body[$key])) throw new ApiException("Invalid field: $key");
    $val = trim($body[$key]);
    if ($val === '') return null;
    if (mb_strlen($val) > $maxLen) {
        throw new ApiException("Field too long: $key");
    }
    return $val;
}

function ac_require_int(array $body, string $key): int
{
    if (!isset($body[$key]) || !is_numeric($body[$key])) {
        throw new ApiException("Missing or invalid field: $key");
    }
    return (int)$body[$key];
}

function ac_optional_int(array $body, string $key): ?int
{
    if (!isset($body[$key]) || $body[$key] === null || $body[$key] === '') return null;
    if (!is_numeric($body[$key])) throw new ApiException("Invalid field: $key");
    return (int)$body[$key];
}

function ac_optional_bool(array $body, string $key): ?bool
{
    if (!isset($body[$key]) || $body[$key] === null) return null;
    return (bool)$body[$key];
}

function ac_require_bool(array $body, string $key): bool
{
    if (!isset($body[$key])) throw new ApiException("Missing field: $key");
    return (bool)$body[$key];
}

function ac_require_email(array $body, string $key): string
{
    $val = ac_require_string($body, $key, 255);
    if (!filter_var($val, FILTER_VALIDATE_EMAIL)) {
        throw new ApiException("Invalid email address");
    }
    return $val;
}

function ac_require_enum(array $body, string $key, array $allowed): string
{
    $val = ac_require_string($body, $key, 50);
    if (!in_array($val, $allowed, true)) {
        throw new ApiException("Invalid value for $key");
    }
    return $val;
}

function ac_require_array(array $body, string $key): array
{
    if (!isset($body[$key]) || !is_array($body[$key])) {
        throw new ApiException("Missing or invalid field: $key");
    }
    return $body[$key];
}
