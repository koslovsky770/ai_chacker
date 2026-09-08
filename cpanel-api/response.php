<?php
declare(strict_types=1);

class ApiException extends Exception
{
    public int $status;
    public function __construct(string $message, int $status = 400)
    {
        parent::__construct($message);
        $this->status = $status;
    }
}

function ac_json_ok($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function ac_json_error(string $message, int $status = 400): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
